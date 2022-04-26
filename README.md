# Tensorflow.js Model Visualizer

This script is used to visualize the network architecture of and tensorflow.js model. Tfjs models are usually as a form of model.json with binary weight file(s). The input and output dimensions information are not given unless you figure it out with json or other reference material. 

This Visualizer helps to generate network architecture with graphviz (dot format).

You can run following node command and dot command to generate a complete network architecture image.

```shell
node model_visualizer.ts facemesh/model.json | dot -Tpng > facemesh.png
```
