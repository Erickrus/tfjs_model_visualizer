/*
 * Tensorflow.js Model Visualizer
 * Author: Hu, Ying-Hao
 * Email: hyinghao@hotmail.com 
 */

require('@tensorflow/tfjs-node');
require('dotenv').config();

// parse command line parameter
// only accept relative filename, e.g. model.json or facemesh/model.json
function getParameter() {
   if (process.argv.length>2) {
      const relativePath = process.cwd();
      const inputFilename = ["file:/", relativePath, process.argv[2]].join("/");
      return inputFilename;
   }
   return "";
}

// generate graphviz
async function main(argv) {
   const debugTf = require('debug')('tf');
   const debugTfVerbose = require('debug')('tf:verbose');
   const tf = require('@tensorflow/tfjs-node');
   const model = await tf.loadGraphModel(getParameter());

   nodes = Object.keys(model.executor.graph.nodes);
   var nodeDeps = [];
   for (nodeName of nodes) {
      var nodeObj = {
         "name": "",
	 "op": "",
	 "category": "",
         "inputs": [],
         "outputs": [],
         "children": []
      }

      // this is where the data comes from
      var node = model.executor.graph.nodes[nodeName];
      nodeObj["name"] = nodeName;
      nodeObj["op"] = node.op;
      nodeObj["category"] = node.category;
      if (node.inputs != null) {
         for(nodeItem of node.inputs) {
	    nodeObj.inputs.push(nodeItem["name"]);
         }
      }
      // currently not used
      if (node.children!= null) {
         for (nodeItem of node.children) {
            nodeObj.children.push(nodeItem["name"]);
         }
      }
      // currently not used
      if (node.outputs != null) {
         for (nodeItem of node.outputs) {
            nodeObj.outputs.push(nodeItem["name"]);
         }
      }
      nodeDeps.push(nodeObj);
   }
	
   // colors are based on category field in the json, some categories are to be added
   var colorMappings = {
      "graph": " style=filled color=\"lightskyblue2\"",
      "transformation" : " style=filled color=\"lightcyan2\"",
      "convolution": " style=filled color=\"seagreen1\"",
      "basic_math" : " style=filled color=\"peru\"",
      "matrices" : " style=filled color=\"snow2\"",
      "arithmetic" : " style=filled color=\"papayawhip\"",
      "slice_join": " style=filled color=\"lightskyblue1\""
   };

   // initialize the digraph
   lines = "digraph G{\n";

   for (var i=0;i<nodeDeps.length;i++){
      var nodeName = nodeDeps[i]["name"];
      var nodeOp = nodeDeps[i]["op"];
      var nodeCategory = nodeDeps[i]["category"];
	   
      // parsing input/placeholder
      if (nodeOp == "Placeholder") {
         for (inputNodeName of Object.keys(model.executor.graph.signature.inputs)) {
            if (model.executor.graph.signature.inputs[inputNodeName].name.replaceAll(":0","") == nodeName) {
               nodeName = inputNodeName;
               var dim = [];
               for (var j=0;j<model.executor.graph.signature.inputs[inputNodeName].tensorShape.dim.length;j++) {
                  dim.push(model.executor.graph.signature.inputs[inputNodeName].tensorShape.dim[j].size)
               }
               nodeName += " ["+dim.join(",")+"]";
	       nodeName = nodeName.replaceAll(":0","");
	       nodeName = nodeName.replaceAll(":1","");
               break;
            }
         }
      }
	   
      // parsing output/identity, which is almost the same as input/placeholder
      if (nodeOp == "Identity") {
	 for (outputNodeName of Object.keys(model.executor.graph.signature.outputs)) {
	    if (model.executor.graph.signature.outputs[outputNodeName].name.replaceAll(":0","") == nodeName) {
	       nodeName = outputNodeName;
	       var dim = [];
	       for (var j=0;j<model.executor.graph.signature.outputs[outputNodeName].tensorShape.dim.length;j++) {
		  dim.push(model.executor.graph.signature.outputs[outputNodeName].tensorShape.dim[j].size)
	       }
	       nodeName += " ["+dim.join(",")+"]";
	       nodeName = nodeName.replaceAll(":0","");
	       nodeName = nodeName.replaceAll(":1","");
	       break;
	    }
	 }
      }

      // skip Const and NoOp, here, NoOp is kind of control node
      if (nodeOp == "Const" || nodeOp == "NoOp"){
	 continue;
      }

      // mapping the colors
      var color ="";
      for (colorKey of Object.keys(colorMappings)) {
	 if (nodeCategory.toLowerCase().indexOf(colorKey)>=0) {
	    color = colorMappings[colorKey];
	    break;
	 }
      }
      
      // generate operation
      var nodeId = i;
      lines += i+" [ shape=\"box\" label=\""+nodeName+" ("+nodeOp+")"+"\""+color+"]\n";

      // generate connection, mainly from inputs
      for (var j=0;j<nodeDeps[i]["inputs"].length;j++) {
	  for (var k=0;k<nodeDeps.length;k++) {
	     if (nodeDeps[k]["op"] == "Const" || nodeDeps[k]["op"] =="NoOp") continue;
	     if (nodeDeps[i]["inputs"][j] == nodeDeps[k]["name"]) {
		lines += k+" -> "+i+"\n";
	     }
	  }
      }
   }

   // It seems this is not needed here
   lines = lines.replaceAll("StatefulPartitionedCall/","");
	
   // finalize the digraph
   lines +="}\n"
   console.log(lines);
}

main(process.argv);
