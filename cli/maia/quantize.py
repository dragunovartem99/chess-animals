# /// script
# dependencies = ["onnx", "numpy"]
# ///
"""Maia's weights as int8, halving the 46 MB the browser downloads for an underwater animal.

    git show ee81af0:public/maia3/maia3_simplified.onnx > maia3_simplified.onnx
    uv run cli/maia/quantize.py maia3_simplified.onnx public/maia3/maia3_int8_f32.onnx

Weight-only: each matrix is stored as int8 with one fp32 scale per output column and turned back
into fp32 when the session loads, so the arithmetic is the upstream model's own. onnxruntime's
dynamic quantizer is not an option — it quantizes the activations too, and the move distribution
moved 4× further for a 1.4× speed-up — and 4-bit blocks moved it ~15x further for 3 MB less.

The rest of the graph is fp32 rather than upstream's fp16: no CPU runtime has fp16 kernels, so a
fp16 graph only runs through casts it inserts itself, and onnxruntime-node crashed folding the
int8 weights through one. Dequantizing to fp32 is a session option away from the same speed as
the fp16 graph in the browser and 2× faster under node, and leaves the model at opset 17.
"""

import sys

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper

source, target = sys.argv[1:]
model = onnx.load(source)
graph = model.graph

FP16, FP32 = TensorProto.FLOAT16, TensorProto.FLOAT


def to_fp32(tensor):
    return numpy_helper.from_array(numpy_helper.to_array(tensor).astype(np.float32), tensor.name)


# Every fp16 in the graph becomes fp32: the weights, the constants, the casts and the types the
# signature declares. Shape info is dropped rather than retyped; the checker re-infers it.
for weight in list(graph.initializer):
    if weight.data_type == FP16:
        graph.initializer.remove(weight)
        graph.initializer.append(to_fp32(weight))
for node in graph.node:
    for attribute in node.attribute:
        if node.op_type == "Cast" and attribute.name == "to" and attribute.i == FP16:
            attribute.i = FP32
        if attribute.name == "value" and attribute.t.data_type == FP16:
            attribute.t.CopyFrom(to_fp32(attribute.t))
for value in [*graph.input, *graph.output]:
    if value.type.tensor_type.elem_type == FP16:
        value.type.tensor_type.elem_type = FP32
del graph.value_info[:]

readers: dict[str, set[str]] = {}
for node in graph.node:
    for name in node.input:
        readers.setdefault(name, set()).add(node.op_type)

dequantize = []
for weight in list(graph.initializer):
    values = numpy_helper.to_array(weight)
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
            numpy_helper.from_array(scale.astype(np.float32), f"{weight.name}_scale"),
        ]
    )
    dequantize.append(
        helper.make_node(
            "DequantizeLinear",
            [f"{weight.name}_int8", f"{weight.name}_scale"],
            [weight.name],
            axis=axis,
        )
    )

for index, node in enumerate(dequantize):
    graph.node.insert(index, node)

onnx.checker.check_model(model)
onnx.save(model, target)
