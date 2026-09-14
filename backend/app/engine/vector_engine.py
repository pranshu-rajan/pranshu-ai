import math
import random
import time
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import heapq

# 16-Dimensional pre-loaded demo categories matching C++ core
DEMO_ITEMS = [
    # Computer Science
    (1, "Quantum Computing & Qubits", "Computer Science", [0.91, 0.85, 0.78, 0.65, 0.12, 0.05, 0.08, 0.15, 0.03, 0.01, 0.02, 0.04, 0.01, 0.02, 0.05, 0.03]),
    (2, "Neural Networks & Deep Learning", "Computer Science", [0.88, 0.92, 0.82, 0.70, 0.15, 0.08, 0.05, 0.12, 0.02, 0.03, 0.01, 0.02, 0.04, 0.01, 0.02, 0.05]),
    (3, "Distributed Consensus Raft", "Computer Science", [0.85, 0.79, 0.89, 0.60, 0.09, 0.04, 0.06, 0.10, 0.01, 0.02, 0.05, 0.03, 0.02, 0.04, 0.01, 0.02]),
    (4, "Compiler AST Optimization", "Computer Science", [0.82, 0.75, 0.86, 0.72, 0.11, 0.06, 0.04, 0.08, 0.03, 0.01, 0.02, 0.04, 0.05, 0.02, 0.03, 0.01]),
    (5, "Operating System Memory Paging", "Computer Science", [0.79, 0.81, 0.84, 0.68, 0.14, 0.07, 0.09, 0.11, 0.02, 0.04, 0.01, 0.03, 0.03, 0.05, 0.02, 0.04]),
    
    # Mathematics
    (6, "Calculus & Derivatives", "Mathematics", [0.62, 0.71, 0.58, 0.92, 0.08, 0.03, 0.04, 0.07, 0.01, 0.02, 0.03, 0.05, 0.02, 0.01, 0.04, 0.02]),
    (7, "Linear Algebra & Eigenvalues", "Mathematics", [0.70, 0.78, 0.65, 0.95, 0.05, 0.02, 0.03, 0.06, 0.02, 0.01, 0.04, 0.02, 0.01, 0.03, 0.02, 0.01]),
    (8, "Differential Geometry & Manifolds", "Mathematics", [0.65, 0.73, 0.61, 0.90, 0.07, 0.04, 0.02, 0.05, 0.03, 0.02, 0.01, 0.04, 0.04, 0.02, 0.01, 0.03]),
    (9, "Number Theory & Prime Fields", "Mathematics", [0.68, 0.75, 0.63, 0.88, 0.06, 0.05, 0.03, 0.09, 0.02, 0.03, 0.02, 0.01, 0.02, 0.04, 0.03, 0.02]),
    (10, "Probability Distributions & Bayes", "Mathematics", [0.74, 0.80, 0.67, 0.89, 0.09, 0.06, 0.05, 0.08, 0.04, 0.01, 0.02, 0.03, 0.01, 0.02, 0.04, 0.05]),
    
    # Food
    (11, "Neapolitan Sourdough Pizza", "Food", [0.05, 0.08, 0.02, 0.04, 0.92, 0.88, 0.85, 0.76, 0.02, 0.04, 0.01, 0.03, 0.05, 0.02, 0.01, 0.04]),
    (12, "Japanese Nigiri Sushi & Wasabi", "Food", [0.03, 0.04, 0.06, 0.02, 0.89, 0.94, 0.82, 0.71, 0.01, 0.02, 0.04, 0.02, 0.03, 0.01, 0.05, 0.02]),
    (13, "French Pastry Butter Croissant", "Food", [0.04, 0.05, 0.03, 0.01, 0.95, 0.89, 0.88, 0.73, 0.03, 0.01, 0.02, 0.04, 0.02, 0.05, 0.01, 0.03]),
    (14, "Mexican Street Tacos & Salsa", "Food", [0.06, 0.07, 0.04, 0.03, 0.88, 0.91, 0.89, 0.79, 0.04, 0.03, 0.01, 0.02, 0.04, 0.02, 0.03, 0.01]),
    (15, "Authentic Thai Green Curry", "Food", [0.02, 0.06, 0.05, 0.04, 0.91, 0.87, 0.93, 0.82, 0.02, 0.05, 0.03, 0.01, 0.01, 0.04, 0.02, 0.05]),
    
    # Sports
    (16, "Football UEFA Champions League", "Sports", [0.08, 0.05, 0.03, 0.02, 0.04, 0.06, 0.02, 0.05, 0.94, 0.91, 0.88, 0.82, 0.03, 0.02, 0.04, 0.01]),
    (17, "NBA Basketball Playoff Strategy", "Sports", [0.07, 0.09, 0.04, 0.03, 0.05, 0.03, 0.04, 0.02, 0.92, 0.95, 0.85, 0.86, 0.01, 0.04, 0.02, 0.03]),
    (18, "Tennis Grand Slam Wimbledon Grass", "Sports", [0.05, 0.04, 0.06, 0.01, 0.03, 0.02, 0.05, 0.04, 0.89, 0.88, 0.93, 0.79, 0.04, 0.01, 0.03, 0.02]),
    (19, "Formula 1 Monaco Aerodynamics", "Sports", [0.15, 0.12, 0.08, 0.09, 0.02, 0.04, 0.01, 0.03, 0.91, 0.87, 0.89, 0.95, 0.02, 0.03, 0.01, 0.04]),
    (20, "Olympic 100m Sprint Biomechanics", "Sports", [0.11, 0.08, 0.05, 0.06, 0.04, 0.05, 0.03, 0.02, 0.95, 0.89, 0.91, 0.84, 0.05, 0.02, 0.02, 0.01])
]

# Distance Functions
def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a - b))

def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na < 1e-9 or nb < 1e-9:
        return 1.0
    dot = np.dot(a, b)
    val = 1.0 - (dot / (na * nb))
    return float(max(0.0, min(2.0, val)))

def manhattan_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sum(np.abs(a - b)))

def get_dist_fn(metric: str):
    if metric == "cosine":
        return cosine_distance
    elif metric == "manhattan":
        return manhattan_distance
    return euclidean_distance


class KDNode:
    def __init__(self, item_id: int, metadata: str, category: str, emb: np.ndarray, axis: int):
        self.id = item_id
        self.metadata = metadata
        self.category = category
        self.emb = emb
        self.axis = axis
        self.left: Optional['KDNode'] = None
        self.right: Optional['KDNode'] = None


class KDTree:
    def __init__(self, items: List[Tuple[int, str, str, np.ndarray]], dims: int = 16):
        self.dims = dims
        self.root = self._build(items, depth=0)

    def _build(self, items: List[Tuple[int, str, str, np.ndarray]], depth: int) -> Optional[KDNode]:
        if not items:
            return None
        axis = depth % self.dims
        items.sort(key=lambda x: x[3][axis])
        mid = len(items) // 2
        mid_item = items[mid]
        
        node = KDNode(mid_item[0], mid_item[1], mid_item[2], mid_item[3], axis)
        node.left = self._build(items[:mid], depth + 1)
        node.right = self._build(items[mid + 1:], depth + 1)
        return node

    def knn(self, query: np.ndarray, k: int, dist_fn) -> List[Tuple[float, int]]:
        best: List[Tuple[float, int]] = []

        def search(node: Optional[KDNode]):
            nonlocal best
            if node is None:
                return
            d = dist_fn(query, node.emb)
            if len(best) < k:
                heapq.heappush(best, (-d, node.id))
            else:
                if d < -best[0][0]:
                    heapq.heapreplace(best, (-d, node.id))

            axis = node.axis
            diff = query[axis] - node.emb[axis]
            first = node.left if diff < 0 else node.right
            second = node.right if diff < 0 else node.left

            search(first)
            # Check bounding hyper-plane
            if len(best) < k or abs(diff) < -best[0][0]:
                search(second)

        search(self.root)
        results = [(-d, item_id) for d, item_id in best]
        results.sort()
        return results


class HNSWNode:
    def __init__(self, node_id: int, metadata: str, category: str, emb: np.ndarray, max_layer: int):
        self.id = node_id
        self.metadata = metadata
        self.category = category
        self.emb = emb
        self.max_layer = max_layer
        # neighbors per layer: list of lists
        self.neighbors: List[List[int]] = [[] for _ in range(max_layer + 1)]


class HNSWIndex:
    def __init__(self, M: int = 16, ef_construction: int = 64, ef_search: int = 32):
        self.M = M
        self.M0 = 2 * M
        self.ef_construction = ef_construction
        self.ef_search = ef_search
        self.mL = 1.0 / math.log(M)
        self.nodes: Dict[int, HNSWNode] = {}
        self.enter_node_id: Optional[int] = None
        self.top_layer: int = 0

    def _random_level(self) -> int:
        r = random.random()
        lvl = int(-math.log(max(r, 1e-9)) * self.mL)
        return min(lvl, 8)

    def insert(self, item_id: int, metadata: str, category: str, emb: np.ndarray, dist_fn):
        level = self._random_level()
        new_node = HNSWNode(item_id, metadata, category, emb, level)
        self.nodes[item_id] = new_node

        if self.enter_node_id is None:
            self.enter_node_id = item_id
            self.top_layer = level
            return

        curr_obj = self.enter_node_id
        curr_dist = dist_fn(emb, self.nodes[curr_obj].emb)

        # 1. Greedy search down from top_layer to level + 1
        for l in range(self.top_layer, level, -1):
            changed = True
            while changed:
                changed = False
                curr_node = self.nodes[curr_obj]
                if l < len(curr_node.neighbors):
                    for neighbor_id in curr_node.neighbors[l]:
                        d = dist_fn(emb, self.nodes[neighbor_id].emb)
                        if d < curr_dist:
                            curr_dist = d
                            curr_obj = neighbor_id
                            changed = True

        # 2. Search layer by layer down to 0 and link neighbors
        ep = [curr_obj]
        for l in range(min(self.top_layer, level), -1, -1):
            candidates = self._search_layer(emb, ep, self.ef_construction, l, dist_fn)
            max_m = self.M0 if l == 0 else self.M
            neighbors = [c[1] for c in candidates[:max_m]]
            new_node.neighbors[l] = neighbors

            # Bidirectional connection
            for n_id in neighbors:
                n_node = self.nodes[n_id]
                if l < len(n_node.neighbors):
                    n_node.neighbors[l].append(item_id)
                    if len(n_node.neighbors[l]) > max_m:
                        # Shrink to nearest max_m
                        n_node.neighbors[l].sort(key=lambda x: dist_fn(n_node.emb, self.nodes[x].emb))
                        n_node.neighbors[l] = n_node.neighbors[l][:max_m]

            ep = [c[1] for c in candidates]

        if level > self.top_layer:
            self.top_layer = level
            self.enter_node_id = item_id

    def _search_layer(self, query: np.ndarray, ep: List[int], ef: int, layer: int, dist_fn) -> List[Tuple[float, int]]:
        visited = set(ep)
        # min-heap for candidates: (dist, id)
        candidates: List[Tuple[float, int]] = []
        # max-heap for dynamic results W: (-dist, id)
        w: List[Tuple[float, int]] = []

        for e in ep:
            d = dist_fn(query, self.nodes[e].emb)
            heapq.heappush(candidates, (d, e))
            heapq.heappush(w, (-d, e))

        while candidates:
            c_dist, c_id = heapq.heappop(candidates)
            furthest_dist = -w[0][0]
            if c_dist > furthest_dist:
                break

            c_node = self.nodes[c_id]
            if layer < len(c_node.neighbors):
                for neighbor_id in c_node.neighbors[layer]:
                    if neighbor_id not in visited:
                        visited.add(neighbor_id)
                        d = dist_fn(query, self.nodes[neighbor_id].emb)
                        furthest_dist = -w[0][0]
                        if d < furthest_dist or len(w) < ef:
                            heapq.heappush(candidates, (d, neighbor_id))
                            heapq.heappush(w, (-d, neighbor_id))
                            if len(w) > ef:
                                heapq.heappop(w)

        results = [(-d, n_id) for d, n_id in w]
        results.sort()
        return results

    def knn(self, query: np.ndarray, k: int, dist_fn) -> List[Tuple[float, int]]:
        if self.enter_node_id is None:
            return []
        curr_obj = self.enter_node_id
        curr_dist = dist_fn(query, self.nodes[curr_obj].emb)

        # Upper layers greedy
        for l in range(self.top_layer, 0, -1):
            changed = True
            while changed:
                changed = False
                c_node = self.nodes[curr_obj]
                if l < len(c_node.neighbors):
                    for n_id in c_node.neighbors[l]:
                        d = dist_fn(query, self.nodes[n_id].emb)
                        if d < curr_dist:
                            curr_dist = d
                            curr_obj = n_id
                            changed = True

        candidates = self._search_layer(query, [curr_obj], max(self.ef_search, k), 0, dist_fn)
        return candidates[:k]

    def get_info(self) -> Dict[str, Any]:
        node_count = len(self.nodes)
        nodes_per_layer = [0] * (self.top_layer + 1)
        edges_per_layer = [0] * (self.top_layer + 1)
        nodes_info = []
        edges_info = []

        for node_id, node in self.nodes.items():
            nodes_info.append({
                "id": node.id,
                "metadata": node.metadata,
                "category": node.category,
                "maxLyr": node.max_layer
            })
            for l in range(node.max_layer + 1):
                nodes_per_layer[l] += 1
                if l < len(node.neighbors):
                    edges_per_layer[l] += len(node.neighbors[l])
                    for dst in node.neighbors[l]:
                        if node.id < dst: # Unique undirected edge
                            edges_info.append({"src": node.id, "dst": dst, "lyr": l})

        return {
            "topLayer": self.top_layer,
            "nodeCount": node_count,
            "nodesPerLayer": nodes_per_layer,
            "edgesPerLayer": edges_per_layer,
            "nodes": nodes_info,
            "edges": edges_info
        }


class VectorEngine:
    def __init__(self, dims: int = 16):
        self.dims = dims
        self.items: Dict[int, Tuple[int, str, str, np.ndarray]] = {}
        self.hnsw = HNSWIndex()
        self.kdtree: Optional[KDTree] = None
        self._load_defaults()

    def _load_defaults(self):
        dist_fn = get_dist_fn("cosine")
        for item_id, meta, cat, vec in DEMO_ITEMS:
            arr = np.array(vec, dtype=np.float32)
            self.items[item_id] = (item_id, meta, cat, arr)
            self.hnsw.insert(item_id, meta, cat, arr, dist_fn)
        self._rebuild_kdtree()

    def _rebuild_kdtree(self):
        item_list = list(self.items.values())
        if item_list:
            self.kdtree = KDTree(item_list, dims=self.dims)
        else:
            self.kdtree = None

    def insert(self, metadata: str, category: str, embedding: List[float]) -> int:
        new_id = max(self.items.keys(), default=0) + 1
        arr = np.array(embedding, dtype=np.float32)
        self.items[new_id] = (new_id, metadata, category, arr)
        dist_fn = get_dist_fn("cosine")
        self.hnsw.insert(new_id, metadata, category, arr, dist_fn)
        self._rebuild_kdtree()
        return new_id

    def delete(self, item_id: int) -> bool:
        if item_id in self.items:
            del self.items[item_id]
            # Rebuild index for clean state
            dist_fn = get_dist_fn("cosine")
            self.hnsw = HNSWIndex()
            for i_id, meta, cat, arr in self.items.values():
                self.hnsw.insert(i_id, meta, cat, arr, dist_fn)
            self._rebuild_kdtree()
            return True
        return False

    def search(self, query: List[float], k: int = 5, metric: str = "cosine", algorithm: str = "hnsw") -> List[Dict[str, Any]]:
        q = np.array(query, dtype=np.float32)
        dist_fn = get_dist_fn(metric)

        if algorithm == "bruteforce":
            results = []
            for i_id, meta, cat, arr in self.items.values():
                d = dist_fn(q, arr)
                results.append((d, i_id))
            results.sort()
            top_k = results[:k]
        elif algorithm == "kdtree":
            if not self.kdtree:
                self._rebuild_kdtree()
            top_k = self.kdtree.knn(q, k, dist_fn) if self.kdtree else []
        else: # HNSW
            top_k = self.hnsw.knn(q, k, dist_fn)

        out = []
        for d, i_id in top_k:
            if i_id in self.items:
                _, meta, cat, _ = self.items[i_id]
                out.append({
                    "id": i_id,
                    "metadata": meta,
                    "category": cat,
                    "distance": round(d, 4)
                })
        return out

    def benchmark(self, query: Optional[List[float]] = None, k: int = 5, metric: str = "cosine") -> Dict[str, Any]:
        if query is None or len(query) != self.dims:
            # Random vector
            q = np.random.uniform(-1, 1, self.dims).astype(np.float32)
        else:
            q = np.array(query, dtype=np.float32)

        dist_fn = get_dist_fn(metric)
        iterations = 50

        # Brute Force
        t0 = time.perf_counter()
        for _ in range(iterations):
            _ = sorted([(dist_fn(q, v[3]), v[0]) for v in self.items.values()])[:k]
        t_bf = ((time.perf_counter() - t0) / iterations) * 1_000_000

        # KD-Tree
        if not self.kdtree:
            self._rebuild_kdtree()
        t0 = time.perf_counter()
        for _ in range(iterations):
            if self.kdtree:
                _ = self.kdtree.knn(q, k, dist_fn)
        t_kd = ((time.perf_counter() - t0) / iterations) * 1_000_000

        # HNSW
        t0 = time.perf_counter()
        for _ in range(iterations):
            _ = self.hnsw.knn(q, k, dist_fn)
        t_hnsw = ((time.perf_counter() - t0) / iterations) * 1_000_000

        return {
            "bruteforceUs": round(t_bf, 2),
            "kdtreeUs": round(t_kd, 2),
            "hnswUs": round(t_hnsw, 2),
            "itemCount": len(self.items)
        }

    def compute_pca(self) -> List[Dict[str, Any]]:
        """Projects 16D vectors to 2D using PCA via SVD / Power iteration."""
        if not self.items:
            return []
        items_list = list(self.items.values())
        X = np.stack([item[3] for item in items_list])
        
        # Mean center
        X_centered = X - np.mean(X, axis=0)
        # SVD
        u, s, vt = np.linalg.svd(X_centered, full_matrices=False)
        components = vt[:2] # Top 2 principal axes
        coords = np.dot(X_centered, components.T)

        # Normalize coordinates to [-100, 100] for UI canvas rendering
        max_abs = np.max(np.abs(coords)) + 1e-9
        normalized = (coords / max_abs) * 85.0

        points = []
        for idx, (item_id, meta, cat, _) in enumerate(items_list):
            points.append({
                "id": item_id,
                "metadata": meta,
                "category": cat,
                "x": round(float(normalized[idx, 0]), 2),
                "y": round(float(normalized[idx, 1]), 2)
            })
        return points

# Global singleton instance
vector_engine = VectorEngine(dims=16)
