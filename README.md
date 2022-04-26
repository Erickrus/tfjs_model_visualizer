# Tensorflow.js Model Visualizer

This script is used to visualize the network architecture of and tensorflow.js model. Tfjs models are usually in a form of model.json with binary weight file(s). The input and output dimensions information are not given unless you figure it out from JSON or from other reference materials. This visualizer helps to generate a complete network architecture with `node` and `graphviz` (dot format). (Notes: Const, NoOp are removed from the architecture)

# Run
You can run following node command and dot command to generate a complete network architecture image. Before that you may need install `nodejs` (related npm packages `@tensorflow/tfjs-node`, `dotenv`) and `graphviz`. 

```shell
node model_visualizer.ts facemesh/model.json | dot -Tpng > facemesh.png
```
# Output

![facemesh](https://raw.githubusercontent.com/Erickrus/tfjs_model_visualizer/main/facemesh.png)

# Future works
One can also use this to reverse engineer the entire network creation and to recover its python code.
