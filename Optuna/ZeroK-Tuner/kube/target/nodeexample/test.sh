ulimit -n 65532
# k6 run script.js 2>/dev/null
k6 run script_highmem.js 2>/dev/null
