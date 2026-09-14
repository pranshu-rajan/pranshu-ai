FROM gcc:13-bookworm AS builder
WORKDIR /app
COPY . .
RUN g++ -O3 -std=c++17 -pthread main.cpp -o vectordb

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/vectordb /app/vectordb
COPY --from=builder /app/index.html /app/index.html
EXPOSE 8080
CMD ["/app/vectordb"]
