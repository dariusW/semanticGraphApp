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
		tools.parseXml = function(src, prop){
			var xmlDoc;
			if (window.DOMParser){
				parser=new DOMParser();
				xmlDoc=parser.parseFromString(src,"text/xml");
			}
			else{
				xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async=false;
				xmlDoc.loadXML(src); 
			} 
			if(prop === true){
				tools.attachClickListeners(xmlDoc);
			}
			return xmlDoc;
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
		//switch source content
		tools.switchSource = function(src){
			if(sourceContainer){
				sourceArea.value=src;
				sourceArea.innerHTML=src;
				tools.validateByAjax(src);
			}
		}
		tools.toggle = function(){
			if(canvasContainer.style.display=="none"){
				containerSwitch.innerHTML = "[SOURCE]";
				sourceContainer.style.display = "none";
				canvasContainer.style.display = "block";
			} else {
				containerSwitch.innerHTML = "[VIEW]";
				canvasContainer.style.display = "none";
				sourceContainer.style.display = "block";			
			}
		}
		tools.reloadValidator = function(src, clean){
			if(validatorWindow != null && clean !== true){
				validatorWindow.close();
				validatorWindow = window.open('about:blank','validatorvindow','width=800,height=600,toolbar=no,location=no,directories=no,status=yes,menubar=yes,scrollbars=yes,copyhistory=yes,resizable=yes');
			}
			if(validatorWindow){
				var validatorForm = "\
							LOADING...\
							<form method='post' enctype='multipart/form-data' action='http://validator.w3.org/check' style='display:none'>\
							<input type='hidden' name='charset' value='utf-8'/>\
							<input type='hidden' name='doctype' value='SVG 1.1'/>\
							<input type='hidden' name='group' value='0'/>\
							<input type='hidden' name='user-agent' value='W3C_Validator/1.3 http://validator.w3.org/services'/>\
							<textarea cols='80' rows='12' name='fragment' id='fragment'>"+src+"</textarea>		\
							</form>\
							<script type='text/javascript'>\
							document.forms[0].submit();\
							</script>\
							"
				validatorWindow.document.write(validatorForm);
			}
		}
		window.onunload = function(){
			if(validatorWindow)validatorWindow.close();
		}
		tools.toggleValidator = function(){
			if(validatorWindow == null){
				validatorSwich.innerHTML = "[HIDE VALIDATOR]";
				
				validatorWindow = window.open('about:blank','validatorvindow','width=800,height=600,toolbar=no,location=no,directories=no,status=yes,menubar=yes,scrollbars=yes,copyhistory=yes,resizable=yes');
				
				tools.reloadValidator(context.currentGraph, true);
				
			} else {
				validatorSwich.innerHTML = "[SHOW VALIDATOR]";
				
				validatorWindow.close();
				
				validatorWindow = null;
			}
		}
		var quickValid = document.getElementById('quickValid');
		tools.printQuickValid = function(a){
			if(a.valid){
				quickValid.style.color = "green";
				quickValid.innerHTML = a.warn + " warnings"
			} else {
				quickValid.style.color = "red";
				quickValid.innerHTML = a.error + " errors " + a.warn + " warnings"			
			}
		
		}
		tools.validateByAjax = function(src){
		
			
			var xmlhttp;
			if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
			  xmlhttp=new XMLHttpRequest();
			} else{// code for IE6, IE5
			  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlhttp.onreadystatechange=function(){
				if (xmlhttp.readyState==4 && xmlhttp.status==200){
					var validatorResponse = JSON.parse(xmlhttp.responseText);
					if(validatorResponse.error == undefined){
						var a = {};
						a.valid = false;
						for(var vName in validatorResponse){
							vVal = validatorResponse[vName];
							
							if(vName == "X-W3C-Validator-Status"){
								if(vVal == "Valid"){
									a.valid = true;
								}
							}
							if(vName == "X-W3C-Validator-Errors"){
								a.error = vVal;
							}
							if(vName == "X-W3C-Validator-Warnings"){
								a.warn = vVal;
							}
							
						}
						tools.printQuickValid(a);
					}
				}
			}
			var params = "f="+src;
			var url = "http://localhost/semanticGraphApp/web.php?"+params;
			xmlhttp.open("POST", url, true);
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.setRequestHeader("Content-length", params.length);
			xmlhttp.setRequestHeader("Connection", "close");
			
			xmlhttp.send(params);
			
		}
		
		//CREATE WORKSPACE
		var body = document.getElementsByTagName("body")[0];
		var container = document.getElementById(defProps.div);		
		var nodesBox = document.getElementById('node-box');		
		var edgesBox = document.getElementById('edge-box');		
		var listBox = document.getElementById('graph-box');		
		var canvasContainer = document.getElementById("canvas-box");
		var sourceContainer = document.getElementById("source-box");	
		var sourceArea = document.getElementById("source");
		var containerSwitch = document.getElementById("workspace_sw");
		if(containerSwitch){
			containerSwitch.onclick = tools.toggle;
		}
		var validatorSwich = document.getElementById("validator_sw");
		if(validatorSwich){
			validatorSwich.onclick = tools.toggleValidator;
		}
		var validatorWindow = null;
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
		tools.removeNode = function(deletecallback){
			var row = document.createElement("div");
			row.className = "row";
			
			var b = document.createElement("button");
			b.setAttribute("type","button");
			b.className = "btn btn-danger";
			b.innerHTML = "REMOVE NODE";
			b.onclick = function(e){
				if(deletecallback(e)){
					paramsMenuContainer.innerHTML = "";
				}
			}				
				
			var div = document.createElement("div");
			div.className = "col-sm-12";
			div.style.marginBottom = "10px";
			div.appendChild(b);
			
			
			row.appendChild(div);
			paramsMenuContainer.appendChild(row);
		}
		tools.printParamAdder = function(callback){
			var row = document.createElement("div");
			row.className = "row";
			var attrNameInput = document.createElement("input");
			attrNameInput.setAttribute("type", "text");
			attrNameInput.className = "form-control";
			attrNameInput.setAttribute("id", "newAttrName");
			var attrValueInput = document.createElement("input");
			attrValueInput.setAttribute("type", "text");
			attrValueInput.className = "form-control";
			attrValueInput.setAttribute("id", "newAttrValue");
			
			var callbackPack = function(event){
				callback(attrNameInput, attrValueInput, event, this);
			}
			attrNameInput.onchange = callbackPack;
			attrValueInput.onchange = callbackPack;
			
			attrNameInput.onchange = callback;
			var div1 = document.createElement("div");
			var div2 = document.createElement("div");
			div1.className = "col-sm-5";
			div1.style.marginBottom = "10px";
			div1.appendChild(attrNameInput);
			div2.className = "col-sm-7";
			div2.style.marginBottom = "10px";
			div2.appendChild(attrValueInput);
			
			
			row.appendChild(div1);
			row.appendChild(div2);
			paramsMenuContainer.appendChild(row);
		}
		tools.innerModifier = function(val, callback){
			var row = document.createElement("div");
			row.className = "row";
			var label = document.createElement("label");
			label.setAttribute("for","attr");
			label.className = "col-sm-3 control-label";
			label.innerHTML = "CONTENT";
			var div = document.createElement("div");
			div.className = "col-sm-7";
			div.style.marginBottom = "10px";
			var input = document.createElement("input");
			input.setAttribute("type", "text");
			input.className = "form-control";
			input.value = val;
			input.onchange = function(e){				
				callback(input.value,e);
			}
			div.appendChild(input);
			row.appendChild(label);
			row.appendChild(div);
			paramsMenuContainer.appendChild(row);
		}
		tools.printParam = function(attr, val, callback, deletable, deletecallback){
			var row = document.createElement("div");
			row.className = "row";
			var label = document.createElement("label");
			label.setAttribute("for","attr");
			label.className = "col-sm-3 control-label";
			label.innerHTML = attr;
			var div = document.createElement("div");
			div.className = "col-sm-7";
			div.style.marginBottom = "10px";
			var input = document.createElement("input");
			input.setAttribute("type", "text");
			input.className = "form-control";
			input.value = val;
			input.onchange = callback;
			input.name = attr;
			div.appendChild(input);
			row.appendChild(label);
			row.appendChild(div);
			
			if(deletable===true){
				//<button type="button" class="btn btn-danger">X</button>
				var delDiv = document.createElement("div");
				delDiv.className = "col-sm-2";
				delDiv.style.marginBottom = "10px";
				var b = document.createElement("button");
				b.setAttribute("type","button");
				b.className = "btn btn-danger";
				b.innerHTML = "X";
				b.onclick = function(e){
					if(deletecallback(attr,e)){
						paramsMenuContainer.removeChild(row);
					}
				}				
				delDiv.appendChild(b);
				row.appendChild(delDiv);
								
			}
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
		tools.idGen = function(){
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for( var i=0; i < 10; i++ ){
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			return text;
		}
		tools.draw = function(item, box,callback){
			var div = document.createElement("div");
			div.className = "item_pic";
			var iid = tools.idGen();
			div.setAttribute("id", iid);
			var i = document.createElement("img");
			i.setAttribute("id", iid);
			item.id = iid;
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
			div.setAttribute("draggable","true");
			div.ondragstart =tools.dragToCanvas;
			
		}
		tools.dragToCanvas = function(event){
			event.dataTransfer.setData("Text",event.target.id);
		}	
		tools.dragOverCanvas = function(event){
			event.preventDefault();
		}
		var draggedNode;
		tools.getIntAtr = function(node, atr){
			var value = node.getAttribute(atr);
			if(value == undefined || value == null){
				return 0;
			}
			value = parseInt(value);
			if(isNaN(value)){
				return 0;
			} 
			return value;
		}
		tools.getInt = function(value){
			if(value == undefined || value == null){
				return 0;
			}
			value = parseInt(value);
			if(isNaN(value)){
				return 0;
			} 
			return value;
		}
		tools.dropOnCanvas = function(event){
			event.preventDefault();
			//TODO: dragg
			var dragS = event.dataTransfer.getData("innerDrag");
			if(dragS){
				var drag = JSON.parse( dragS);
				var dX = event.clientX-drag.x;
				var dY = event.clientY-drag.y;
				var vv = draggedNode.getAttribute("x");
				if((draggedNode.getAttribute("x")!=null && draggedNode.getAttribute("x")!=undefined) || (draggedNode.getAttribute("y")!=null && draggedNode.getAttribute("x")!=undefined)){
					draggedNode.setAttribute("x", tools.getIntAtr(draggedNode,"x")+dX);
					draggedNode.setAttribute("y", tools.getIntAtr(draggedNode,"y")+dY);
				} else if((draggedNode.getAttribute("cx")!=null && draggedNode.getAttribute("cx")!=undefined) || (draggedNode.getAttribute("cy")!=null && draggedNode.getAttribute("cy")!=undefined)){
					draggedNode.setAttribute("cx", tools.getIntAtr(draggedNode,"cx")+dX);
					draggedNode.setAttribute("cy", tools.getIntAtr(draggedNode,"cy")+dY);
				} else if(draggedNode.getAttribute("points")!=null && draggedNode.getAttribute("points")!=undefined){
					var pointsList = draggedNode.getAttribute("points").split(" ");
					var merge = "";
					for(var i=0; i<pointsList.length;i++){
						var point = pointsList[i].split(",");
						var x = tools.getInt(point[0])+dX;
						var y = tools.getInt(point[1])+dY;
						merge += x+","+y+" ";
					}
					merge = merge.substr(0,merge.length-1);
					draggedNode.setAttribute("points", merge);
				} else {
					draggedNode.setAttribute("x", tools.getIntAtr(draggedNode,"x")+dX);
					draggedNode.setAttribute("y", tools.getIntAtr(draggedNode,"y")+dY);				
				}
				var root = draggedNode;
				while(root.parentNode){
					root = root.parentNode;
					if(root.nodeName=="svg"){
						break;
					}
				}
				context.currentGraphData.src = root.outerHTML;
				context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
				context.drawGraph(context.currentGraphData);
				
			} else {
				var id=event.dataTransfer.getData("Text");
				if(id){
					var a = tools.findById(id);
					if(a){
						a.src;
						context.currentGraphData;
						
						var content  = a.xml.firstChild.children;
						for(var ii = 0; ii < content.length; ii++){
							var child = tools.parseXml(content[ii].outerHTML);	
							context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src, true);
							context.currentGraphData.xml.firstChild.appendChild(child.firstChild);
							context.currentGraphData.src = context.currentGraphData.xml.firstChild.outerHTML;
						}
						context.drawGraph(context.currentGraphData);
					}
				}
			}
			
		}
		var modifieNode;
		var modifieNodeAttr;
		tools.attachClickListeners = function(xml){
			var digDeeper = function(children){
				for(var i=0;i<children.length;i++){
					digDeeper(children[i].children);
					var oldFunc = children[i].onclick;
					//children[i].setAttribute("draggable","true");
					children[i].ondragstart = function(event){
						draggedNode = event.target;
						event.dataTransfer.setData("innerDrag",JSON.stringify({x: event.clientX, y: event.clientY}));
					}
					children[i].onclick = function (event){
						if( typeof  oldFunc == "function"){
							oldFunc(event);
						}
						paramsMenuContainer.innerHTML = "";
						modifieNode = this;
						modifieNodeAttr = this.attributes;
						tools.removeNode(function(e){
							if(confirm("Do you whant to remove entire node?")){
								var root = modifieNode;
								while(root.parentNode){
									root = root.parentNode;
									if(root.nodeName=="svg"){
										break;
									}
								}
								modifieNode.parentNode.removeChild(modifieNode);
								context.currentGraphData.src = root.outerHTML;
								context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
								context.drawGraph(context.currentGraphData);
								return true;
							}
							return false;
							
						});
						tools.innerModifier(modifieNode.innerHTML, function(val,e){
							modifieNode.innerHTML = val;
							var root = modifieNode;
							while(root.parentNode){
								root = root.parentNode;
								if(root.nodeName=="svg"){
									break;
								}
							}
							context.currentGraphData.src = root.outerHTML;
							context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
							context.drawGraph(context.currentGraphData);
						});
						tools.printParamAdder(function(name,value,event,item){
							if(name && name.value && value && value.value){
								modifieNode.setAttribute(name.value, value.value);
								var root = modifieNode;
								while(root.parentNode){
									root = root.parentNode;
									if(root.nodeName=="svg"){
										break;
									}
								}
								context.currentGraphData.src = root.outerHTML;
								context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
								context.drawGraph(context.currentGraphData);
								tools.printParam(name.value, value.value, function(e){
									for(var j = 0; j < modifieNodeAttr.length; j++){
										if(modifieNodeAttr[j].name ==  this.name){
											modifieNodeAttr[j].value = this.value;
											
											
											var root = modifieNode;
											while(root.parentNode){
												root = root.parentNode;
												if(root.nodeName=="svg"){
													break;
												}
											}
											context.currentGraphData.src = root.outerHTML;
											context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
											context.drawGraph(context.currentGraphData);
											return;
										}
									}		
								}, true, function(name,e){
									if(confirm("Really remove attribute "+name+"?")){
										modifieNode.removeAttribute(name);
										var root = modifieNode;
										while(root.parentNode){
											root = root.parentNode;
											if(root.nodeName=="svg"){
												break;
											}
										}
										context.currentGraphData.src = root.outerHTML;
										context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
										context.drawGraph(context.currentGraphData);
										return true;
									}
									return false;
								});
								name.value = "";
								value.value= "";
							}
						});
						for(var ii=0; ii< modifieNodeAttr.length;ii++){
							var atr = modifieNodeAttr[ii];
							var atrName = atr.name;
							var atrVal = atr.value;
							tools.printParam(atrName, atrVal, function(e){							
								for(var j = 0; j < modifieNodeAttr.length; j++){
									if(modifieNodeAttr[j].name ==  this.name){
										modifieNodeAttr[j].value = this.value;
										
										
										var root = modifieNode;
										while(root.parentNode){
											root = root.parentNode;
											if(root.nodeName=="svg"){
												break;
											}
										}
										context.currentGraphData.src = root.outerHTML;
										context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
										context.drawGraph(context.currentGraphData);
										return;
									}
								}
							}, true, function(name, e){
								if(confirm("Really remove attribute "+name+"?")){
									modifieNode.removeAttribute(name);
									var root = modifieNode;
									while(root.parentNode){
										root = root.parentNode;
										if(root.nodeName=="svg"){
											break;
										}
									}
									context.currentGraphData.src = root.outerHTML;
									context.currentGraphData.xml = tools.parseXml(context.currentGraphData.src);
									context.drawGraph(context.currentGraphData);
									return true;
								}
								return false;
							});
							
						}
					}
				}
			}
			var root = xml.firstChild;
			digDeeper(root.children);
		}
		canvasContainer.ondragover = tools.dragOverCanvas;
		canvasContainer.ondrop = tools.dropOnCanvas;
		
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
		edges.find = function(id){
			for(var i = 0; i<this.length; i++){
				var edge = edges[i];
				if(id == edge.id){
					return edge;
				}
			}
		}
		var nodes = new Array();
		nodes.draw = function(item){
			tools.draw(item,nodesBox);	
		}
		nodes.drawAll = function(){
			for(var i = 0; i<this.length; i++)
				this.draw(this[i]);
		
		}
		nodes.find = function(id){
			for(var i = 0; i<this.length; i++){
				var node = nodes[i];
				if(id == node.id){
					return node;
				}
			}
		}
		
		tools.findById = function(id){
			var result = edges.find(id);
			if(result == undefined || result == null){
				result = nodes.find(id);
			}
			return result;
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
		context.currentGraph = "";
		context.currentGraphData = null;
		context.drawGraph = function(graph){
			graph.xml = tools.parseXml(graph.src,true);
			var img = document.createElement("object"); 
			img.appendChild(graph.xml.firstElementChild);
			img.type = "image/svg+xml";
			//context.clear();
			canvasContainer.innerHTML="";
			canvasContainer.appendChild(img);
			
			//store current gra[ph reload validator
			context.currentGraph = graph.src;
			tools.reloadValidator(context.currentGraph);
			context.currentGraphData = graph;
			tools.switchSource(graph.src);
			
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
		
		//switch view
		
		
		
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
		
		$('#registerSubmit').click(function(){
			var isBlank = function(v){
				if(v === null || v === undefined || v.trim() === ""){
					return false;
				}
				return true;
			}
			var form = $('#registerModal form');
			var email = form[0][0].value==undefined?null:form[0][0].value;
			var pass = form[0][1].value==undefined?null:form[0][1].value;
			var passRp = form[0][2].value==undefined?null:form[0][2].value;
			if(!isBlank(email) || !isBlank(pass) || !isBlank(passRp)){	
				alert("Invalid input");					
			} else {
				if(pass === passRp){
					$.post( "register.php", {email: email, pass: pass, passRp: passRp}, function( data ) {
						if(data.success=="true"){
							alert("Thank you for registration. You can login now");
						} else {
							alert("Error. "+data.error);						
						}
					});				
				} else {
					alert("Password dont match");		
				}
			}
		});
		$('#loginSubmit').click(function(){
			var isBlank = function(v){
				if(v === null || v === undefined || v.trim() === ""){
					return false;
				}
				return true;
			}
			var form = $('#loginModal form');
			var email = form[0][0].value==undefined?null:form[0][0].value;
			var pass = form[0][1].value==undefined?null:form[0][1].value;
			if(!isBlank(email) || !isBlank(pass)){	
				alert("Invalid input");					
			} else {
				$.post( "login.php", {email: email, pass: pass}, function( data ) {
					if(data.success=="true"){
						alert("Thank you for login.");
					} else {
						alert("Error. "+data.error);						
					}
				});		
			}
		});
	}
	return loader;
})();