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
		
		//CREATE WORKSPACE
		var body = document.getElementsByTagName("body")[0];
		body.setAttribute("style", "padding: 0; margin: 0");
		var container = document.getElementById(defProps.div);
		var leftMenuContainer = document.createElement("div");
		leftMenuContainer.style.width = "20%";
		leftMenuContainer.style.background = "#dedede";
		leftMenuContainer.style.cssFloat = "left";
		container.appendChild(leftMenuContainer);
		var leftMenuList = document.createElement("ul");
		leftMenuList.style.listStyle="none";
		leftMenuContainer.appendChild(leftMenuList);
		var canvasContainer = document.createElement("div");
		canvasContainer.style.width = "80%";
		canvasContainer.style.cssFloat = "left";
		container.appendChild(canvasContainer);
		var canvas = document.createElement("canvas");
		canvasContainer.appendChild(canvas);
		var bottomMenuConrainer = document.createElement("div");
		bottomMenuConrainer.style.width = "80%";
		bottomMenuConrainer.style.background = "#dedede";
		bottomMenuConrainer.style.cssFloat = "left";
		container.appendChild(bottomMenuConrainer);
		var saveButton = document.createElement("input");
		saveButton.setAttribute("type","button");
		saveButton.setAttribute("value","save");
		bottomMenuConrainer.appendChild(saveButton);
		
		//init workspace
		var context;
		graphs = new Array();		
		saveButton.onclick = function(){
			for(var i=0; i<graphs.length; i++){
				var graph = graphs[0];
				var stringGraph = JSON.stringify(graph);
				eval('localStorage.graph'+i+'=graph');
			}		
		}
		if(undefined != canvas.getContext){
			context = canvas.getContext('2d');
		}		
		context.drawGraphListItem = function(graph){
			var li = document.createElement("li");
			li.onclick = function(e){
				context.clear();
				context.drawImage(graph.img,0,0);
			}
			li.innerHTML = graph.name;
			leftMenuList.appendChild(li);
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
		
			
		for(var i=0; localStorage.graphs.length; i++){
			context.drawGraphListItem(graphs[i]);
		}
		
		canvasContainer.drop = function (e) {
			e = e || window.event; // get window.event if e argument missing (in IE)   
			if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
			var dt = e.dataTransfer;
			var files = dt.files;
			for (var i=0; i<files.length; i++) {
				var file = files[i];
				if(file.type == "image/svg+xml"){
					var readerImg = new FileReader();
					var loadendImg = function(e) {
						var bin = this.result; 
						var img = document.createElement("img"); 
						img.file = file;   
						img.src = bin;
						file.img = img;
						//leftMenuContainer.appendChild(img);
						context.clear();
						context.drawImage(img,0,0);
						context.drawGraphListItem(file);
						graphs.push(file);
					}
					addEventHandler(readerImg, 'loadend', loadendImg);
					readerImg.readAsDataURL(file)
					
					/*
					var readerSrc = new FileReader();
					var loadendSrc = function(e) {
						var bin = this.result; 
						file.src = bin;
					}
					addEventHandler(readerImg, 'loadend', loadendSrc);
					readerImg.readAsText(file)
					*/
				} else {
					alert("invalid MIME type");
				}
			}
		  return false;
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
		}
		
		var onResize = function(){
			var workspaceHeight = window.innerHeight;
			leftMenuContainer.style.height = workspaceHeight+"px";
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