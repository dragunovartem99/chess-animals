# /// script
# dependencies = ["onnx", "numpy"]
# ///
"""Maia's weights as int8, halving the 46 MB the browser downloads for an underwater animal.

    git show ee81af0:public/maia3/maia3_simplified.onnx > maia3_simplified.onnx
    uv run cli/maia/quantize.py maia3_simplified.onnx public/maia3/maia3_int8.onnx

Weight-only: each matrix is stored as int8 with one fp32 scale per output column and turned back
into fp16 when the session loads, so the arithmetic is the upstream model's own. onnxruntime's
dynamic quantizer is not an option — it quantizes the activations too, which are fp16 here and
which it refuses — and 4-bit blocks moved the move distribution ~15x further for 3 MB less.
fp32 scales rather than fp16 keep the model at opset 17: fp16 scales need 19, whose ReduceMean
no longer reads the `axes` this graph gives it.
"""

import sys

import numpy as np
import onnx
from onnx import helper, numpy_helper

source, target = sys.argv[1:]
model = onnx.load(source)
graph = model.graph

readers: dict[str, set[str]] = {}
for node in graph.node:
    for name in node.input:
        readers.setdefault(name, set()).add(node.op_type)

dequantize = []
for weight in list(graph.initializer):
    values = numpy_helper.to_array(weight).astype(np.float32)
    # Biases and norms are a rounding error of the size and the most sensitive to rounding.
    if values.ndim != 2 or values.size < 4096:
        continue

    # A MatMul's columns are its outputs; anything else (the embeddings) is scaled per row.
    axis = 1 if readers.get(weight.name) == {"MatMul"} else 0
    scale = np.abs(values).max(axis=1 - axis) / 127
    scale[scale == 0] = 1
    quantized = np.round(values / np.expand_dims(scale, 1 - axis)).astype(np.int8)

    graph.initializer.remove(weight)
    graph.initializer.extend(
        [
            numpy_helper.from_array(quantized, f"{weight.name}_int8"),
            numpy_helper.from_array(scale, f"{weight.name}_scale"),
        ]
    )
    dequantize += [
        helper.make_node(
            "DequantizeLinear",
            [f"{weight.name}_int8", f"{weight.name}_scale"],
            [f"{weight.name}_fp32"],
            axis=axis,
        ),
        helper.make_node(
            "Cast", [f"{weight.name}_fp32"], [weight.name], to=onnx.TensorProto.FLOAT16
        ),
    ]

for index, node in enumerate(dequantize):
    graph.node.insert(index, node)

onnx.checker.check_model(model)
onnx.save(model, target)
