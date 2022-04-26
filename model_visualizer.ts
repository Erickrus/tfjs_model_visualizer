/*
 * Tensorflow.js Model Visualizer
 * Author: Hu, Ying-Hao
 * Email: hyinghao@hotmail.com 
 */

require('@tensorflow/tfjs-node');
require('dotenv').config();

// parse parameter
function getParameter() {
   if (process.argv.length>2) {
      const relativePath = process.cwd();
      const inputFilename = ["file:/", relativePath, process.argv[2]].join("/");
      //console.log(inputFilename);
      return inputFilename;
   }
   return "";
}

// generate graph
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

      var node = model.executor.graph.nodes[nodeName];
      nodeObj["name"] = nodeName;
      nodeObj["op"] = node.op;
      nodeObj["category"] = node.category;
      if (node.inputs != null) {
         for(nodeItem of node.inputs) {
	    nodeObj.inputs.push(nodeItem["name"]);
         }
      }
      if (node.children!= null) {
         for (nodeItem of node.children) {
            nodeObj.children.push(nodeItem["name"]);
         }
      }
      if (node.outputs != null) {
         for (nodeItem of node.outputs) {
            nodeObj.outputs.push(nodeItem["name"]);
         }
      }
      nodeDeps.push(nodeObj);
   }

   var colorMappings = {
      "graph": " style=filled color=\"lightskyblue2\"",
      "transformation" : " style=filled color=\"lightcyan2\"",
      "convolution": " style=filled color=\"seagreen1\"",
      "basic_math" : " style=filled color=\"peru\"",
      "matrices" : " style=filled color=\"snow2\"",
      "arithmetic" : " style=filled color=\"papayawhip\"",
      "slice_join": " style=filled color=\"lightskyblue1\""
   };

   lines = "digraph G{\n";

   for (var i=0;i<nodeDeps.length;i++){
      var nodeName = nodeDeps[i]["name"];
      var nodeOp = nodeDeps[i]["op"];
      var nodeCategory = nodeDeps[i]["category"];
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

      if (nodeOp == "Identity") {
	 for (outputNodeName of Object.keys(model.executor.graph.signature.outputs)) {
	    if (model.executor.graph.signature.outputs[outputNodeName].name.replaceAll(":0","") == nodeName) {
	       nodeName = outputNodeName;
	       var dim = [];
	       for (var j=0;j<model.executor.graph.signature.outputs[outputNodeName].tensorShape.dim.length;j++) {
		  dim.push(model.executor.graph.signature.outputs[outputNodeName].tensorShape.dim[j].size)
	       }
	       nodeName += " ["+dim.join(",")+"]";
	       break;
	    }
	 }
      }
      if (nodeOp == "Const" || nodeOp == "NoOp"){
	 continue;
      }
      var color ="";
      for (colorKey of Object.keys(colorMappings)) {
	 if (nodeCategory.toLowerCase().indexOf(colorKey)>=0) {
	    color = colorMappings[colorKey];
	    break;
	 }
      }
      
      var nodeId = i;
      lines += i+" [ shape=\"box\" label=\""+nodeName+" ("+nodeOp+")"+"\""+color+"]\n";

      for (var j=0;j<nodeDeps[i]["inputs"].length;j++) {
	  for (var k=0;k<nodeDeps.length;k++) {
	     if (nodeDeps[k]["op"] == "Const" || nodeDeps[k]["op"] =="NoOp") continue;
	     if (nodeDeps[i]["inputs"][j] == nodeDeps[k]["name"]) {
		//lines += i+" -> "+k+"\n";
		lines += k+" -> "+i+"\n";
	     }
	  }
      }
      /*
      // no need for the children, it is completely duplicated
      for (var j=0;j<nodeDeps[i]["children"].length;j++) {
	  for (var k=0;k<nodeDeps.length;k++) {
	     if (nodeDeps[k]["op"] == "Const" || nodeDeps[k]["op"] =="NoOp") continue;
	     if (nodeDeps[i]["children"][j] == nodeDeps[k]["name"]) {
		lines += i+" -> "+k+" [color=\"red\"]\n";
	     }
	  }
      }*/
   }
   lines = lines.replaceAll("StatefulPartitionedCall/","");
   lines +="}\n"
   console.log(lines);
}

main(process.argv);
