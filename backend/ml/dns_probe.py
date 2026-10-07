#!/usr/bin/env python3
"""
backend/ml/dns_probe.py
Real DNS Measurement Engine using dnspython with concurrent execution.

Performs:
1. Syntax and domain validation.
2. Real record resolution (A, AAAA, NS, CNAME, MX, TXT).
3. Authoritative nameserver direct queries and comparison.
4. Multi-resolver vantage point probes (Cloudflare, Google, Quad9, OpenDNS).
5. Comprehensive metrics calculation (round-trip latency, RCODE, error rate, health score).

Usage:
  python dns_probe.py --domain example.com
"""

import sys
import json
import time
import argparse
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import dns.resolver
    import dns.message
    import dns.query
    import dns.rdatatype
    import dns.rcode
    import dns.exception
except ImportError:
    sys.stderr.write("dnspython is required. Run: pip install dnspython\n")
    sys.exit(1)


VANTAGE_POINTS = [
    {"id": "cloudflare", "name": "Cloudflare Anycast", "ip": "1.1.1.1", "location": "Global Anycast Edge"},
    {"id": "google",     "name": "Google Public DNS", "ip": "8.8.8.8", "location": "Multi-Region Tier 1"},
    {"id": "quad9",      "name": "Quad9 DNS",         "ip": "9.9.9.9", "location": "Threat-Filtered Anycast"},
    {"id": "opendns",    "name": "OpenDNS / Cisco",   "ip": "208.67.222.222", "location": "Anycast Backbone"},
]


def validate_domain(domain: str) -> bool:
    if not domain or len(domain) > 253:
        return False
    parts = domain.rstrip('.').split('.')
    if len(parts) < 2 and domain != 'localhost':
        return False
    for part in parts:
        if not part or len(part) > 63:
            return False
    return True


def probe_vantage_point(domain: str, vp: dict, timeout: float = 3.5) -> dict:
    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = [vp["ip"]]
    resolver.timeout = timeout
    resolver.lifetime = timeout

    start = time.perf_counter()
    try:
        ans = resolver.resolve(domain, 'A')
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        answers = [str(x) for x in ans]
        rcode_str = "NOERROR"
        status = "ONLINE"
        source = f"SOURCE: {vp['name']} probe ({vp['ip']})"
    except dns.resolver.NXDOMAIN:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        answers = []
        rcode_str = "NXDOMAIN"
        status = "ONLINE"
        source = f"SOURCE: {vp['name']} probe ({vp['ip']})"
    except dns.resolver.NoAnswer:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        answers = []
        rcode_str = "NOANSWER"
        status = "ONLINE"
        source = f"SOURCE: {vp['name']} probe ({vp['ip']})"
    except Exception as e:
        # Fallback to DoH if local network blocks or drops outbound UDP port 53 to this IP
        doh_endpoints = {
            "cloudflare": "https://cloudflare-dns.com/dns-query",
            "google": "https://8.8.8.8/dns-query",
            "quad9": "https://9.9.9.9/dns-query",
            "opendns": "https://208.67.222.222/dns-query",
        }
        doh_url = doh_endpoints.get(vp["id"])
        if doh_url:
            try:
                doh_start = time.perf_counter()
                q = dns.message.make_query(domain, dns.rdatatype.A)
                resp = dns.query.https(q, doh_url, timeout=timeout)
                doh_elapsed = round((time.perf_counter() - doh_start) * 1000, 2)
                rcode_code = resp.rcode()
                rcode_str = dns.rcode.to_text(rcode_code)
                answers = []
                for rrset in resp.answer:
                    if rrset.rdtype == dns.rdatatype.A:
                        answers.extend([str(x) for x in rrset])
                status = "ONLINE" if rcode_str in ["NOERROR", "NOANSWER", "NXDOMAIN"] else "ERROR"
                elapsed_ms = max(1.0, doh_elapsed)
                return {
                    "id": vp["id"],
                    "name": vp["name"],
                    "ip": vp["ip"],
                    "location": vp["location"],
                    "latency_ms": elapsed_ms,
                    "rcode": rcode_str,
                    "status": status,
                    "answers": answers,
                    "source": f"SOURCE: {vp['name']} DoH probe ({vp['ip']})",
                }
            except Exception:
                pass

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        answers = []
        rcode_str = "TIMEOUT" if isinstance(e, (dns.resolver.Timeout, dns.exception.Timeout)) else "SERVFAIL"
        status = "TIMEOUT" if rcode_str == "TIMEOUT" else "ERROR"
        source = f"SOURCE: {vp['name']} probe ({vp['ip']})"

    return {
        "id": vp["id"],
        "name": vp["name"],
        "ip": vp["ip"],
        "location": vp["location"],
        "latency_ms": max(1.0, elapsed_ms),
        "rcode": rcode_str,
        "status": status,
        "answers": answers,
        "source": source,
    }


def query_single_record(domain: str, rtype: str, timeout: float = 2.0):
    resolver = dns.resolver.Resolver()
    resolver.timeout = timeout
    resolver.lifetime = timeout
    try:
        answers = resolver.resolve(domain, rtype)
        results = []
        for rdata in answers:
            if rtype == "MX":
                results.append(f"{rdata.preference} {str(rdata.exchange).rstrip('.')}")
            elif rtype in ["NS", "CNAME"]:
                results.append(str(rdata.target).rstrip('.'))
            elif rtype == "TXT":
                results.append(str(rdata.strings[0].decode('utf-8', errors='ignore')) if rdata.strings else str(rdata))
            else:
                results.append(str(rdata))
        return rtype, results
    except Exception:
        return rtype, []


def query_records(domain: str, timeout: float = 2.0) -> dict:
    records = {"A": [], "AAAA": [], "NS": [], "CNAME": [], "MX": [], "TXT": []}
    record_types = ["A", "AAAA", "NS", "CNAME", "MX", "TXT"]

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(query_single_record, domain, rt, timeout) for rt in record_types]
        for f in as_completed(futures):
            rt, vals = f.result()
            records[rt] = vals

    return records


def probe_single_auth_ns(domain: str, ns_host: str, timeout: float = 2.0) -> dict:
    ns_ip: str | None = None
    try:
        addr_info = socket.getaddrinfo(ns_host, 53, socket.AF_INET, socket.SOCK_DGRAM)
        if addr_info:
            ns_ip = str(addr_info[0][4][0])
    except Exception:
        pass

    if not ns_ip:
        return {
            "host": ns_host,
            "ip": "UNRESOLVED",
            "latency_ms": 0,
            "rcode": "UNRESOLVED",
            "status": "OFFLINE",
            "source": f"SOURCE: Direct authoritative query ({ns_host})",
        }

    start = time.perf_counter()
    try:
        q = dns.message.make_query(domain, dns.rdatatype.A)
        response = dns.query.udp(q, ns_ip, timeout=timeout)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        rcode_name = dns.rcode.to_text(response.rcode())
        status = "ONLINE" if rcode_name in ["NOERROR", "NXDOMAIN"] else "DEGRADED"
    except (dns.exception.Timeout, TimeoutError):
        elapsed_ms = round(timeout * 1000, 2)
        rcode_name = "TIMEOUT"
        status = "TIMEOUT"
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        rcode_name = type(e).__name__.upper()
        status = "ERROR"

    return {
        "host": ns_host,
        "ip": ns_ip,
        "latency_ms": max(1.0, elapsed_ms),
        "rcode": rcode_name,
        "status": status,
        "source": f"SOURCE: Direct authoritative query ({ns_host} @ {ns_ip})",
    }


def query_authoritative_nameservers(domain: str, ns_list: list, timeout: float = 2.0) -> list:
    if not ns_list:
        return []

    targets = ns_list[:4]
    with ThreadPoolExecutor(max_workers=len(targets)) as executor:
        futures = [executor.submit(probe_single_auth_ns, domain, host, timeout) for host in targets]
        return [f.result() for f in futures]


def run_measurement(domain: str) -> dict:
    domain = domain.strip().lower()
    ts = int(time.time() * 1000)

    if not validate_domain(domain):
        return {
            "ok": False,
            "error": f"Invalid domain format: '{domain}'",
            "domain": domain,
            "timestamp": ts,
        }

    # 1. Query records concurrently
    records = query_records(domain)

    # 2 & 3. Run Authoritative probes and Vantage Point probes concurrently
    ns_list = records.get("NS", [])

    with ThreadPoolExecutor(max_workers=8) as executor:
        auth_future = executor.submit(query_authoritative_nameservers, domain, ns_list)
        vp_futures = [executor.submit(probe_vantage_point, domain, vp) for vp in VANTAGE_POINTS]

        authoritative_probes = auth_future.result()
        vantage_probes = [f.result() for f in vp_futures]

    # 4. Metrics & Statistics
    all_probes = vantage_probes + [p for p in authoritative_probes if p.get("ip") != "UNRESOLVED"]
    latencies = [p["latency_ms"] for p in all_probes if p["status"] != "TIMEOUT" and p["latency_ms"] > 0]
    if not latencies:
        latencies = [p["latency_ms"] for p in all_probes]

    avg_lat = round(sum(latencies) / len(latencies), 2) if latencies else 0.0
    min_lat = round(min(latencies), 2) if latencies else 0.0
    max_lat = round(max(latencies), 2) if latencies else 0.0
    sorted_lats = sorted(latencies)
    
    # Primary NOC Latency: Median
    if sorted_lats:
        mid = len(sorted_lats) // 2
        median_lat = round((sorted_lats[mid] if len(sorted_lats) % 2 != 0 else (sorted_lats[mid - 1] + sorted_lats[mid]) / 2.0), 2)
    else:
        median_lat = 0.0

    p95_idx = int(len(sorted_lats) * 0.95)
    p95_lat = sorted_lats[p95_idx] if sorted_lats else avg_lat

    rcodes = [p["rcode"] for p in all_probes]
    total_queries = len(all_probes)
    
    # Distinct Semantic Rates
    servfail_count = sum(1 for r in rcodes if r == "SERVFAIL")
    timeout_count = sum(1 for r in rcodes if r == "TIMEOUT")
    refused_count = sum(1 for r in rcodes if r == "REFUSED")
    nxdomain_count = sum(1 for r in rcodes if r == "NXDOMAIN")
    
    # Resolution Failure Rate: SERVFAIL + TIMEOUT + REFUSED (excludes benign NXDOMAIN)
    resolution_failure_count = servfail_count + timeout_count + refused_count
    resolution_failure_rate = round((resolution_failure_count / total_queries) * 100, 2) if total_queries > 0 else 0.0
    nxdomain_rate = round((nxdomain_count / total_queries) * 100, 2) if total_queries > 0 else 0.0
    servfail_rate = round((servfail_count / total_queries) * 100, 2) if total_queries > 0 else 0.0
    timeout_rate = round((timeout_count / total_queries) * 100, 2) if total_queries > 0 else 0.0

    rcode_counts = {}
    for r in rcodes:
        rcode_counts[r] = rcode_counts.get(r, 0) + 1

    dominant_rcode = max(rcode_counts, key=lambda k: rcode_counts[k]) if rcode_counts else "NOERROR"

    # Evidence-based health score:
    # NXDOMAIN is "NAME NOT FOUND", not an infrastructure critical failure
    if dominant_rcode == "NXDOMAIN":
        health_score = 100.0
        system_health_status = "NOT_FOUND"
    elif dominant_rcode == "SERVFAIL" or resolution_failure_rate >= 25.0:
        health_score = 0.0
        system_health_status = "CRITICAL"
    elif resolution_failure_rate > 5.0 or median_lat > 350.0:
        health_score = max(50.0, round(100.0 - (resolution_failure_rate * 2.0), 1))
        system_health_status = "DEGRADED"
    else:
        health_score = 100.0
        system_health_status = "HEALTHY"

    return {
        "ok": True,
        "domain": domain,
        "timestamp": ts,
        "records": records,
        "authoritative": authoritative_probes,
        "vantage_points": vantage_probes,
        "summary": {
            "avg_latency": avg_lat,
            "median_latency": median_lat,
            "min_latency": min_lat,
            "max_latency": max_lat,
            "p95_latency": p95_lat,
            "total_queries": total_queries,
            "error_count": resolution_failure_count,
            "error_rate": resolution_failure_rate,
            "resolution_failure_rate": resolution_failure_rate,
            "nxdomain_rate": nxdomain_rate,
            "servfail_rate": servfail_rate,
            "timeout_rate": timeout_rate,
            "dominant_rcode": dominant_rcode,
            "rcode_counts": rcode_counts,
            "health_score": health_score,
            "status": system_health_status,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="DNS_X Real DNS Probe")
    parser.add_argument("--domain", type=str, required=True, help="Target domain to probe")
    args = parser.parse_args()

    result = run_measurement(args.domain)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
