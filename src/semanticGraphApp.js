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
		
		//private methods
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
		
		//CREATE WORKSPACE
		var body = document.getElementsByTagName("body")[0];
		body.setAttribute("style", "padding: 0; margin: 0");
		var container = document.getElementById(defProps.div);
		var leftMenuContainer = tools.appendSimpleBox(container, "PALETTE");
		leftMenuContainer.style.borderRight = "3px solid #dedede";
		leftMenuContainer.style.cssFloat = "left";
		leftMenuContainer.style.background = "#dedede";
		leftMenuContainer.style.overflow="auto";
		leftMenuContainer.height = "100%";
		
		var nodesBox = tools.appendSimpleBox(leftMenuContainer, "Nodes");
		nodesBox.style.borderTop = "2px solid #dedede";
		nodesBox.style.borderBottom = "2px solid #dedede";
		
		var edgesBox = tools.appendSimpleBox(leftMenuContainer, "Edges");
		edgesBox.style.borderBottom = "2px solid #dedede";
		
		var listBox =tools.appendSimpleBox(leftMenuContainer, "Saved graphs");
		listBox.style.borderBottom = "2px solid #dedede";
		
		var leftMenuList = document.createElement("ul");
		leftMenuList.style.listStyle="none";
		listBox.appendChild(leftMenuList);
		leftMenuContainer.appendChild(listBox);
		
		var canvasContainer = document.createElement("div");
		canvasContainer.style.width = "70%";
		canvasContainer.style.cssFloat = "left";
		container.appendChild(canvasContainer);
		
		var canvas = document.createElement("canvas");
		canvasContainer.appendChild(canvas);
		
		var bottomMenuConrainer = tools.appendSimpleBox(container);
		bottomMenuConrainer.style.width = "70%";
		bottomMenuConrainer.style.background = "#dedede";
		bottomMenuConrainer.style.cssFloat = "left";
		
		var saveButton = document.createElement("input");
		saveButton.setAttribute("type","button");
		saveButton.setAttribute("value","save");
		saveButton.onclick = function(){
			storageControl.save();
		}
		bottomMenuConrainer.appendChild(saveButton);
		
		var clearButton = document.createElement("input");
		clearButton.onclick=function(){
			storageControl.clear();
		}
		clearButton.setAttribute("type","button");
		clearButton.setAttribute("value","clear");
		bottomMenuConrainer.appendChild(clearButton);
		
		var graphs = new Array();
		graphs.draw = function(graph){
			context.clear();
			context.drawGraph(graph);		
		}
		graphs.drawListItem = function(graph){
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
		}
		graphs.drawAllListItems = function(){
			for(var i = 0; i<this.length; i++)
				this.drawListItem(this[i]);
		}
		var edges = new Array();
		edges.draw = function(edge){
			var img = document.createElement("img");
			img.src = edge.bin;
			img.style.width = "50%";
			edgesBox.appendChild(img);
		}
		edges.drawAll = function(){
			for(var i = 0; i<this.length; i++)
				this.draw(this[i]);
		
		}
		var nodes = new Array();
		nodes.draw = function(item){
			var img = document.createElement("img");
			img.src = item.bin;
			img.style.width = "50%";
			nodesBox.appendChild(img);		
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
						graphs.push(eval('('+graph+')'));
					}catch(e){
						alert();
					}
				}
				if(nodePM.test(props)){
					var graph;
					try{
						graph = eval("localStorage."+props);
						nodes.push(eval('('+graph+')'));
					}catch(e){
						alert();
					}
				}
				if(edgePM.test(props)){
					var graph;
					try{
						graph = eval("localStorage."+props);
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
			localStorage.clear();
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
		}
		storageControl.load();
		
		//init workspace
		var context;
		if(undefined != canvas.getContext){
			context = canvas.getContext('2d');
		}
		context.drawGraph = function(graph){
			var img = document.createElement("img"); 
			img.src = graph.bin;
			context.clear();
			context.drawImage(img,0,0);		
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
			context.fillStyle = "#fff";
			context.fillRect(0,0,canvas.width,canvas.height);
		}
		
		tools.dropFileHandler = function (e,action) {
			e = e || window.event; // get window.event if e argument missing (in IE)   
			if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
			var dt = e.dataTransfer;
			var files = dt.files;
			for (var i=0; i<files.length; i++) {
				var file = files[i];
				if(file.type == "image/svg+xml"){
					var readerImg = new FileReader();
					var loadendImg = function(e) {
						var store = {};
						var bin = this.result; 
						store.bin = bin;
						store.name = file.name;
						
						var readerSrc = new FileReader();
						var loadendSrc = function(e) {
							var bin = this.result; 
							store.src = bin;
							
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
		  return false;
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
			var workspaceHeight = window.innerHeight;
			var workspaseWidth = window.innerWidth;
			leftMenuContainer.style.height = workspaceHeight+"px";
			leftMenuContainer.style.width = (workspaseWidth*0.3-3)+"px";
			canvasContainer.style.height = (Math.ceil(workspaceHeight*0.7))+"px";
			canvas.height = canvasContainer.clientHeight;
			canvas.width = canvasContainer.clientWidth;
			bottomMenuConrainer.style.height = (workspaceHeight-Math.ceil(workspaceHeight*0.7))+"px";
			
			context.drawDropInfo();
		}
		onResize();
		window.onresize=onResize;
		
		context.drawDropInfo();
		
	}
	return loader;
})();