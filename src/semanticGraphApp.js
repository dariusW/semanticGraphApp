var SemanticGraphApp = (function (){
	var loader = function(props){
		var defProps = {
			div: "semantic_graph_ui"
		};
		if(undefined != props){
			if(undefined != props.div){
				defProps.div = props.div;
			}
		}
		
		var addEventHandler = function(obj, evt, handler) {
			if(obj.addEventListener) {
				obj.addEventListener(evt, handler, false);
			} else if(obj.attachEvent) {
				obj.attachEvent('on'+evt, handler);
			} else {
				obj['on'+evt] = handler;
			}
		}
		
		var tools = {};
		tools.appendSimpleBox = function(parent, headerLabel){
			box = document.createElement("div");
			box.style.width = "100%";
			box.style.minHeight = "100px";
			box.style.background = "#fff";
			parent.appendChild(box);
			
			if(undefined != headerLabel){
				var header = document.createElement("h5");
				header.innerHTML = headerLabel;
				header.style.borderBottom = "1px solid black";
				box.appendChild(header);
			}
			return box;
		}
		//parser DOM
		tools.parseXml = function(src){
			if (window.DOMParser){
				parser=new DOMParser();
				xmlDoc=parser.parseFromString(src,"text/xml");
				return xmlDoc;
			}
			else{
				xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async=false;
				xmlDoc.loadXML(src); 
				return xmlDoc;
			} 
		}
		
		//load external file
		tools.loadFile = function (files,action){
			for (var i=0; i<files.length; i++) {
				var file = files[i];
				if(file.type == "image/svg+xml"){
					var readerImg = new FileReader();
					var loadendImg = function(e) {
						var store = {};
						var bin = this.result; 
						store.bin = bin;
						store.name = file.name;
						store.alert = false;
						store.threshold = 0.8;
						
						var readerSrc = new FileReader();
						var loadendSrc = function(e) {
							var bin = this.result; 
							store.src = bin;
							store.xml = tools.parseXml(bin);
							//actions goes here
							action(store);
						}
						addEventHandler(readerSrc, 'loadend', loadendSrc);
						readerSrc.readAsText(file)
						
					}
					addEventHandler(readerImg, 'loadend', loadendImg);
					readerImg.readAsDataURL(file)
				} else {
					alert("invalid MIME type");
				}
			}
		}
		
		//load file from drop event
		tools.dropFileHandler = function (e,action) {
			e = e || window.event; // get window.event if e argument missing (in IE)   
			if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
			var dt = e.dataTransfer;
			var files = dt.files;
			tools.loadFile(files,action);
		  return false;
		}
		//load file from input
		tools.addFileHandler = function(id,action){
			var button = document.getElementById(id+"B");
			var fileUploader = document.getElementById(id);
			fileUploader.onchange = function(e){
				tools.loadFile(this.files,action);
			}
		}
		
		//CREATE WORKSPACE
		var body = document.getElementsByTagName("body")[0];
		var container = document.getElementById(defProps.div);		
		var nodesBox = document.getElementById('node-box');		
		var edgesBox = document.getElementById('edge-box');		
		var listBox = document.getElementById('graph-box');		
		var canvasContainer = document.getElementById("canvas-box");		
		var canvas = document.createElement("canvas");
		//canvasContainer.appendChild(canvas);
		var workspaceMenuContainer = document.getElementById("workspace-box");		
		var paramsMenuContainer = document.getElementById("params-box");		
		var saveButton = document.getElementById("save");
		var advanceSerch = document.getElementById("advanceSerch");
		
		saveButton.onclick = function(){
			storageControl.save();
		}		
		var clearButton = document.getElementById("clear");
		clearButton.onclick=function(){
			storageControl.clear();
		}
		var useAdvanceSearch = false;
		advanceSerch.onclick = function(e){
			useAdvanceSearch = !useAdvanceSearch;
		}
		//tree compare agoritm
		var findInTreeStart = function(tree,pattern,th){	
			//skiped nodes
			var skipNode = new Array("defs");
			skipNode.contains = function(match){
				for(var i; i < skipNode.length; i++){
					var node = skipNode[i];
					if(node == match){
						return true;
					}
				}
				return false;
			}
			//compare nodes
			var compare = function(node1, node2){
				if(!useAdvanceSearch){
					return node1.nodeName.toUpperCase() === node2.nodeName.toUpperCase();
				} else {
					//alert("advance compare");
					var maxpoints = 25;
					var points = 0;
					if(node1.nodeName.toUpperCase() === node2.nodeName.toUpperCase()){
						points += 20;
					}
					var n1attr = node1.attributes;
					var n2attr = node2.attributes;
					n2attr.contains = function(value){
						for(var i; i<n2attr.length; i++){
							var v = n2attr[i];
							if(value.nodeName == v.nodeName){
								points += 2;
								if(value.nodeValue == v.nodeValue){
									points += 1;
								}
							}
						}
					}
					if(n1attr.length == n2attr.length){
						points += 5;
					}
					for(var i; i<n1attr.length; i++){
						maxpoints += 3;
						n2attr.contains(n1attr[i]);
					}
					if(th>1){
						alert("Invalid treshold for item. Must be less or eq 1");
					}
					return (th<(points/maxpoints));					
					
					/*
					for(atr in node1){
						maxpoints += 1;
						var n1 = eval("node1."+atr);
						var n2 = eval("node2."+atr);
						if(n1 == n2){
							points += 1;
						}
					}
					*/
					//alert(maxpoints+" "+points);
					return false;
				}
			}
			
			var findInTree = function(tree1, tree2, results){				
				var children = tree1.children;
				for(var idx = 0; idx < children.length; idx++){
					var child = children[idx];
					if(skipNode.contains(child) && useAdvanceSearch){
						continue;
					}
					var result = findInTree(child, tree2,results);
					results.push(result);
				}				
				var stats = {treeNodes:0, patternNodes:0,matched:0};
				stats = compareTree(tree1, tree2, stats);			
				return stats;
			}
				
			//compare level
			var compareTree = function(tree1, tree2, stats){
				var myNode = tree1;
				var cmpNode = tree2;
				while(cmpNode != null){
				
					if(skipNode.contains(cmpNode) && useAdvanceSearch){
						continue;
					} 
					stats.patternNodes += 1;
					if(myNode != null){
						if(skipNode.contains(myNode) && useAdvanceSearch){
							while(skipNode.contains(myNode)){
								myNode = myNode.nextElementSibling;
							}
						} 
						stats.treeNodes += 1;
						var compResult = compare(myNode, cmpNode);
						if(compResult){
							stats.matched += 1;
						}					
						var cmpNodeChildren = cmpNode.children;
						var myNodeChildren = myNode.children;
						
						var cmpNodeChild = null;
						var myNodeChild = null;
						
						if(cmpNodeChildren != null){
							for(var i=0; i<cmpNodeChildren.length; i++){
								cmpNodeChild = cmpNodeChildren[i];
								if(myNodeChildren != null && i < myNodeChildren.length){
									myNodeChild = myNodeChildren[i]
								}
								stats = compareTree(myNodeChild, cmpNodeChild, stats);
							}
						}
						
						var cmpNodeChildrenSize = cmpNodeChildren != null ? cmpNodeChildren.length : 0;
						var myNodeChildrenSize = myNodeChildren != null ? myNodeChildren.length : 0;
						if(myNodeChildrenSize > cmpNodeChildrenSize){
							stats.treeNodes += myNodeChildrenSize - cmpNodeChildrenSize;
						}
						
						
						myNode = myNode.nextElementSibling;
					}
					cmpNode = cmpNode.nextElementSibling;
				}
				stats.tree = tree1;
				stats.pattern = tree2;
				return stats;
			}
				
			var results = new Array();
			var result = findInTree(tree,pattern, results);
			results.push(result);
			return results;
		}
		//params
		var graphs = new Array();
		tools.printParams = function(item){
			paramsMenuContainer.innerHTML = "";
			tools.printParam("Name", item.name, function(){
				item.name = this.value;
			});
			tools.printParam("Threshold", item.threshold, function(){
				item.threshold = parseFloat(this.value);
			});
			tools.printParamChbox("Alert on match", item.alert, function(){
				item.alert=(!item.alert);
			});
		}
		tools.printParam = function(attr, val, callback){
			var row = document.createElement("div");
			row.className = "row";
			var label = document.createElement("label");
			label.setAttribute("for","attr");
			label.className = "col-sm-2 control-label";
			label.innerHTML = attr;
			var div = document.createElement("div");
			div.className = "col-sm-10";
			div.style.marginBottom = "10px";
			var input = document.createElement("input");
			input.setAttribute("type", "text");
			input.className = "form-control";
			input.value = val;
			input.onchange = callback;
			div.appendChild(input);
			row.appendChild(label);
			row.appendChild(div);
			paramsMenuContainer.appendChild(row);
			
		}
		tools.printParamChbox = function(attr, val, callback){
			var row = document.createElement("div");
			row.className = "row";
			var div = document.createElement("div");
			div.className = "checkbox col-sm-12";		
			var label = document.createElement("label");
			div.appendChild(label);
			var input = document.createElement("input");
			input.setAttribute("type","checkbox");
			if(val){
				input.setAttribute("checked","checked");
			}
			label.onclick = callback;
			label.appendChild(input);			
			label.innerHTML = label.innerHTML + attr;			
			row.appendChild(div);
			paramsMenuContainer.appendChild(row);
			
		}
		//graph on click action
		graphs.draw = function(graph){
			graph.xml = tools.parseXml(graph.src);
			graph.allNodes = 0;
			graph.matchedNodes = 0;
			graph.find = function(dom,pattern,th){
				var found = new Array();
				var results = findInTreeStart(dom, pattern.firstElementChild, th);	
				for(var i = 0; i < results.length; i++){
					var item = results[i];
					if(pattern!=null){
						if(item.matched != 0 || item.patternNodes != 0 || item.treeNodes != 0){
							if(item.matched==item.patternNodes && item.patternNodes==item.treeNodes){
								found.push({pattern: item.pattern, tree: item.tree});
							}
						}
					}
				}
				return found;
			}
			var callbackFunction = function(found, node){
				var tree = found.tree;
				var pattern = node;
				var oldOnClick = f.tree.onclick;
				f.tree.onclick = function(e, stopClear){
					var p = pattern;
					p.display.onclick();
					
					if(stopClear == undefined){
						for(var i = 0; i<currentlyFound.length;i++){
							var c = currentlyFound[i];
							c.className = "item_pic";
						}
						currentlyFound = new Array();
					}
					if(oldOnClick != null){
						oldOnClick(e, true);
					}
					currentlyFound.push(node.display);
					node.display.className = "item_pic found";
					
					if(p.alert == true){
						alert(pattern.name);
					}
				}
			}
			var nodeIdx = 0;
			for(nodeIdx; nodeIdx < nodes.length; nodeIdx++){
				var node = nodes[nodeIdx];
				node.xml = tools.parseXml(node.src);
				var found = graph.find(graph.xml.firstChild, node.xml.firstChild,node.threshold);
				//alert(node.name +": "+found.length);
				for(var i = 0; i < found.length; i++){
					var f = found[i];
					callbackFunction(f, node);
				}				
			}
			var edgeIdx = 0;
			for(edgeIdx; edgeIdx < edges.length; edgeIdx++){
				var edge = edges[edgeIdx];
				edge.xml = tools.parseXml(edge.src);
				var found = graph.find(graph.xml.firstChild, edge.xml.firstChild,edge.threshold);
				//alert(node.name +": "+found.length);
				for(var i = 0; i < found.length; i++){
					var f = found[i];
					callbackFunction(f, edge);
				}		
			}
			
			context.clear();
			var title = document.getElementById("currentGraph");
			title.innerHTML = graph.name;
			context.drawGraph(graph);
		}
		tools.draw = function(item, box,callback){
			var div = document.createElement("div");
			div.className = "item_pic";
			var i = document.createElement("img");
			i.src = item.bin;
			i.style.width="60px";
			i.width=60;	
			div.appendChild(i);	
			
			div.onclick = function(){
				for(var i = 0; i<currentlyFound.length;i++){
					var c = currentlyFound[i];
					c.className = "item_pic";
				}
				currentlyFound = new Array();
				if(null != currentlySelected){
					currentlySelected.className = "item_pic";
				}
				currentlySelected = this;
				currentlySelected.className = "item_pic active";
				if(null != callback){
					callback();
				}
				tools.printParams(item);
			}
			item.display = div;
			box.appendChild(div);	
			
		}
		graphs.drawListItem = function(item){
			var callback = function(){
				graphs.draw(item);
			}	
			tools.draw(item,listBox,callback);

			/*
			if(graph==undefined)
				return;
			var li = document.createElement("li");
			li.onclick = function(e){
				graphs.draw(graph);
			}
			if(graph.name != undefined)
				li.innerHTML = graph.name;
			else 
				li.innerHTML = "NONAME";
			leftMenuList.appendChild(li);
			*/
		}
		graphs.drawAllListItems = function(){
			for(var i = 0; i<this.length; i++)
				this.drawListItem(this[i]);
		}
		var edges = new Array();
		edges.draw = function(item){
			tools.draw(item,edgesBox);
		}
		edges.drawAll = function(){
			for(var i = 0; i<this.length; i++)
				this.draw(this[i]);
		
		}
		var nodes = new Array();
		nodes.draw = function(item){
			tools.draw(item,nodesBox);	
		}
		nodes.drawAll = function(){
			for(var i = 0; i<this.length; i++)
				this.draw(this[i]);
		
		}
		
		var storageControl = {};
		storageControl.load = function(){
			
			for(props in localStorage){
				var graphPM = /^graph[0-9]+$/g;
				var nodePM = /^node[0-9]+$/g;
				var edgePM = /^edge[0-9]+$/g;
				if(graphPM.test(props)){
					var graph;
					try{
						graph = eval("localStorage."+props);
						graph.xml = tools.parseXml(graph);
						graphs.push(eval('('+graph+')'));
					}catch(e){
						alert();
					}
				}
				if(nodePM.test(props)){
					var graph;
					try{
						graph = eval("localStorage."+props);
						graph.xml = tools.parseXml(graph);
						nodes.push(eval('('+graph+')'));
					}catch(e){
						alert();
					}
				}
				if(edgePM.test(props)){
					var graph;
					try{
						graph = eval("localStorage."+props);
						graph.xml = tools.parseXml(graph);
						edges.push(eval('('+graph+')'));
					}catch(e){
						alert();
					}
				}

			}		
			edges.drawAll();
			nodes.drawAll();
			graphs.drawAllListItems();
		}
		storageControl.clear = function(){
			if(confirm("Do you realy whant to do that?")){
				localStorage.clear();
				location.reload();
			}
		}
		storageControl.save = function(){
			localStorage.clear();
			for(var i=0; i<graphs.length; i++){
				var graph = graphs[i];
				var stringGraph = JSON.stringify(graph);
				eval('localStorage.graph'+i+'=stringGraph');
			}
			for(var i=0; i<edges.length; i++){
				var edg = edges[i];
				var stringEdge = JSON.stringify(edg);
				eval('localStorage.edge'+i+'=stringEdge');
			}		
			for(var i=0; i<nodes.length; i++){
				var node = nodes[i];
				var stringNode = JSON.stringify(node);
				eval('localStorage.node'+i+'=stringNode');
			}	
			alert("Done!");
		}
		storageControl.load();
		
		//init workspace
		var context;
		if(undefined != canvas.getContext){
			context = canvas.getContext('2d');
		}
		context.drawGraph = function(graph){
			var img = document.createElement("object"); 
			img.appendChild(graph.xml.firstElementChild);
			img.type = "image/svg+xml";
			//context.clear();
			canvasContainer.innerHTML="";
			canvasContainer.appendChild(img);
			//context.drawImage(img,0,0);		
		}
		context.drawDropInfo = function(){
			context.font="50px Arial";
			context.fillStyle = "#dedede"
			context.textAlign = 'center';
			context.fillText('Drop file here', canvas.width/2, canvas.height/2, canvas.width);
			context.lineWidth=5;
			context.strokeStyle = "#dedede";
			context.strokeRect((canvas.width-320)/2,(canvas.height-110)/2,320,80);
		};
		context.clear = function(){
			var title = document.getElementById("currentGraph");
			title.innerHTML = "";
			context.fillStyle = "#fff";
			context.fillRect(0,0,canvas.width,canvas.height);
		}
		
		
		nodesBox.drop = function (e) {
			tools.dropFileHandler(e, function(item){
				nodes.push(item);
				nodes.draw(item);
			});
		}		
		edgesBox.drop = function (e) {
			tools.dropFileHandler(e, function(item){
				edges.push(item);
				edges.draw(item);
			
			});
			
		}		
		canvasContainer.drop = function (e) {
			tools.dropFileHandler(e, function(item){
				graphs.push(item);
				graphs.draw(item);
				graphs.drawListItem(item);
			});
			
		}
		var addGraph = tools.addFileHandler("addGraph", function(item){
				graphs.push(item);
				graphs.draw(item);
				graphs.drawListItem(item);
		});
		var addNode = tools.addFileHandler("addNode", function(item){
				nodes.push(item);
				nodes.draw(item);
		});
		var addEdge = tools.addFileHandler("addEdge", function(item){
				edges.push(item);
				edges.draw(item);
			
		});
		
		canvasContainer.dropCancelBubble = function(e) {
			if (e.preventDefault){
				e.preventDefault(); 
			}
			return false;
		}		
		if(window.FileReader) { 
			addEventHandler(canvasContainer, 'dragover', canvasContainer.dropCancelBubble);
			addEventHandler(canvasContainer, 'dragenter', canvasContainer.dropCancelBubble);			
			addEventHandler(canvasContainer, 'drop', canvasContainer.drop);	
			
			addEventHandler(listBox, 'dragover', canvasContainer.dropCancelBubble);
			addEventHandler(listBox, 'dragenter', canvasContainer.dropCancelBubble);		
			addEventHandler(listBox, 'drop', canvasContainer.drop);		
			
			addEventHandler(edgesBox, 'dragover', canvasContainer.dropCancelBubble);
			addEventHandler(edgesBox, 'dragenter', canvasContainer.dropCancelBubble);			
			addEventHandler(edgesBox, 'drop', edgesBox.drop);	

			addEventHandler(nodesBox, 'dragover', canvasContainer.dropCancelBubble);
			addEventHandler(nodesBox, 'dragenter', canvasContainer.dropCancelBubble);			
			addEventHandler(nodesBox, 'drop', nodesBox.drop);				
		}
		
		var onResize = function(){
			//var workspaceHeight = window.innerHeight;
			//var workspaseWidth = window.innerWidth;
			//leftMenuContainer.style.height = workspaceHeight+"px";
			//leftMenuContainer.style.width = (workspaseWidth*0.3-3)+"px";
			//canvasContainer.style.height = (Math.ceil(workspaceHeight*0.7))+"px";
			//canvas.height = canvasContainer.clientHeight;
			//canvas.width = canvasContainer.clientWidth;
			//bottomMenuConrainer.style.height = (workspaceHeight-Math.ceil(workspaceHeight*0.7))+"px";
			
			//context.drawDropInfo();
		}
		onResize();
		window.onresize=onResize;
		
		context.drawDropInfo();
		
		var currentlySelected = null;
		var currentlyFound = new Array();
	}
	return loader;
})();