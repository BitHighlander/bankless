fetch("http://localhost:4000/api/v1/status").then(x => x.json()).then(x => x.billacceptor === "online", () => false).then(x => process.exit(x ? 0 : 1))
