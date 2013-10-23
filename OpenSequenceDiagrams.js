/**
	OpenSequenceDiagrams.js

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var Sequence = (function() {

	//Constansts ------------------------------------------------------------------

	var partSize = 125; //Participant width
	var interPart = 25; //Horizontal interval between 2 participants

	//SVG functions ---------------------------------------------------------------

	function drawText(x, y, text, center) {
		return '<text x="'+x+'" y="'+ y + '"' + (center ? ' style="text-anchor:middle;"' : '') + '>'+text+'</text>';
	}

	function drawRect(x, y, width, height, ry, fill, stroke) {
		return '<rect'
				+ ' x="' + x
				+ '" y="' + y
				+ '" width="' + width
				+ '" height="' + height
				+ '" ry="' + ry
				+ '" style="fill:' + fill + ';'
				+ (stroke ? 'stroke:black;stroke-width:2;' : '') + '" ></rect>';
	}

	function drawLine(x1, y1, x2, y2, isDotted) {
		return '<line x1="' + x1
				+ '" y1="' + y1 
				+ '" x2="' + x2 
				+ '" y2="' + y2 
				+ '" style="stroke:black;stroke-width:2" '
				+ (isDotted ? 'stroke-dasharray="10,5"' : '')
				+ '></line>';
	}

	function drawTriangle(x, y, isToTheRight) {
		var x1 = (isToTheRight ? x-15 : x+15);
		return '<polygon points="' + x1 + ',' + (y-5) + ' '
				+ x + ',' + y + ' '
				+ x1 + ',' + (y+5) + '" '
	  			+ 'style="fill:black;"></polygon>';
	}

	function gradient(id) {
		return '<linearGradient id="' + id + '" x1="0%" y1="0%" x2="0%" y2="100%">'
				+ '<stop offset="0%" style="stop-color:rgb(200, 200, 200);stop-opacity:1"></stop>'
				+ '<stop offset="100%" style="stop-color:rgb(100,100,100);stop-opacity:1"></stop>'
				+ '</linearGradient>'
	}

	function actor(x, y, height, text) {
		var end = text.length * 20 + 10;
		var r = '<g transform="translate('+x+','+y+')">';
		r+= drawLine(partSize/2, end, partSize/2, height);
		r += rectWithText(0, 0, text, true);
		r += rectWithText(0, height, text, true);
		r+='</g>';
		return r;
	}

	function rectWithText(x, y, text, gradient) {
		var end = text.length * 20 + 10;
		var r = '<g transform="translate('+x+','+y+')">';
		r+= drawRect(0, 0, partSize, end, 5, (gradient ? 'url(#grad1)' : 'white'), true);
		for(var i in text) {
			r+= drawText(partSize/2, i*20+20, text[i], true);
		}
		r+='</g>';
		return r;
	}

	function specialRectangle(x, y, w, h, type, comment) {
		var svg = "";
		svg += drawRect(x, y, 70, 30, 0, 'white', false);
	
		svg += drawRect(x, y, w, h, 0, 'none', true);
	
		svg += drawLine(x, y+30, x+60, y+30, false);
		svg += drawLine(x+60, y+30, x+70, y+20, false);
		svg += drawLine(x+70, y+20, x+70, y, false);
	
		svg += drawText(x+30, y+20, type, true);
	
		if(comment != "") {
			svg += drawText(x+90, y+20, '['+comment+']', false);
		}
		return svg;
	}

	function arrow(x, y, width, text, isToTheRight, isDotted, isToSelf) {
		var r = '<g transform="translate('+x+','+y+')">';
		var lineY = 7+(text.length-1)*20;
		if(isToSelf) {
			r+= drawLine(0, lineY, 30, lineY, isDotted);
			r+= drawLine(30, lineY, 30, lineY+20, isDotted);
			r+= drawLine(30, lineY+20, 0, lineY+20, isDotted);
			r+= drawTriangle(0, lineY+20, false);
		} else {
			r+= drawLine(0, lineY, (partSize+interPart)*width, lineY, isDotted);
			r+= drawTriangle((isToTheRight ? (partSize+interPart)*width : 0), lineY, isToTheRight);
		}
		for(var i in text) {
			r+= drawText((partSize+interPart)*width/2, i*20, text[i], true);
		}
		r+='</g>';
		return r;
	}


	//Model -----------------------------------------------------------------------

	function filter(text) {
		return text.replace(/</g, "&lt;");
	}

	//Participant

	function Participant(name, text) {
		this.name = name;
		if(text == undefined) {
			this.text = name.split("\\n");
		} else {
			this.text = text.split("\\n");
		}
		this.height = this.text.length*20+10+30;
		this.position = 0;
	
		this.getSVG = function(height) {
			return actor((partSize+interPart)*this.position+5, 5, height, this.text);
		}
	}

	//Signal

	function Signal(participant1, participant2, text, isDotted) {
		this.participant1 = participant1;
		this.participant2 = participant2;
		this.text = text.split("\\n");
		this.isDotted = isDotted;
		this.height = this.text.length*20+10;
		if(participant1.name == participant2.name) {
			this.height += 20;
		}
	
		this.getHeight = function() {
			return this.height;
		}
	
		this.getSVG = function(position, width) {
			var minPosition = Math.min(this.participant1.position,
					this.participant2.position);
			return arrow(minPosition*(partSize+interPart)+5+partSize/2,
					position+10,
					Math.abs(this.participant1.position
						- this.participant2.position),
					this.text,
					minPosition == this.participant1.position,
					this.isDotted,
					participant1.name == participant2.name);
		}
	}

	//State

	function State(participant, text) {
		this.participant = participant;
		this.text = text.split("\\n");
		this.height = this.text.length*20+15;
	
		this.getHeight = function() {
			return this.height;
		}
	
		this.getSVG = function(position, width) {
			return rectWithText(
					this.participant.position*(partSize+interPart)+5,
					position,
					this.text,
					false);
		}
	}

	//Container

	function Container(parent) {
		this.children = [];
		this.height = 0;
		this.parent = parent;
		this.depth = 0;
		if(parent != null) {
			this.depth = parent.getDepth()+1;
		}
	}

	Container.prototype.getDepth = function() {
		return this.depth;
	}

	Container.prototype.getParent = function() {
		return this.parent;
	}

	Container.prototype.addSignal = function(signal) {
		this.children.push(signal);
	}

	Container.prototype.getHeight = function() {
		var height = this.height;
		for(var i in this.children) {
			height += this.children[i].getHeight();
		}
		return height;
	}

	Container.prototype.getSVG = function(position, width) {
		var svg = "";
		for(var i in this.children) {
			svg += this.children[i].getSVG(position, width);
			position += this.children[i].getHeight();
		}
		return svg;
	}

	//Parallel container

	function ParallelContainer(parent) {
		Container.call(this, parent);
	}

	ParallelContainer.prototype = new Container();

	ParallelContainer.prototype.getHeight = function() {
		for(var i in this.children) {
			if(this.children[i].getHeight() > this.height) {
				this.height = this.children[i].getHeight();
			}
		}
		return this.height;
	}

	ParallelContainer.prototype.getSVG = function(position, width) {
		var svg = "";
		for(var i in this.children) {
			svg += this.children[i].getSVG(position + this.height - this.children[i].getHeight());
		}
		return svg;
	}

	//Loop container

	function SimpleContainer(parent, type, times) {
		Container.call(this, parent);
		this.height = 60;
		this.times = times;
		this.type = type;
	}

	SimpleContainer.prototype = new Container();

	SimpleContainer.prototype.getHeight = function() {
		var height = this.height;
		for(var i in this.children) {
			height += this.children[i].getHeight();
		}
		return height;
	}

	SimpleContainer.prototype.getSVG = function(position, width) {
		var svg = "";
		svg += specialRectangle(10*(this.getDepth()+1),
				position,
				width-((this.getDepth()+1)*2*10),
				this.getHeight()-10,
				this.type,
				(this.times == "" ? "" : this.times + " times"));
		position += 50;
		for(var i in this.children) {
			svg += this.children[i].getSVG(position, width);
			position += this.children[i].getHeight();
		}
		return svg;
	}

	//Schema

	function Schema() {
		this.participants = [];
		this.signals = new Container(null);
		this.patterns = [
			['[ \t]*participant[ ]*"([^"]*)"[ ]*as[ ]*"?([^"]*)"?',
				2,
				'this.addParticipant(new Participant(res[2], res[1]));'],
			['[ \t]*participant[ ]*"?([^"]*)"?',
				1,
				'this.addParticipant(new Participant(res[1]));'],
			['[ \t]*parallel[ ]*{[ ]*',
				0,
				'var p = new ParallelContainer(this.signals); this.addSignal(p); this.signals = p;'],
			['[ \t]*}[ ]*',
				0,
				'if(!(this.signals instanceof ParallelContainer)) res[0]=null;'
				+ 'else this.signals = this.signals.getParent();'],
			['[ \t]*opt[ ]*',
				0,
				'var p = new SimpleContainer(this.signals, "opt", ""); this.addSignal(p); this.signals = p;'],
			['[ \t]*loop[ ]*([0-9]+)[ ]*times[ ]*',
				1,
				'var p = new SimpleContainer(this.signals, "loop", res[1]); this.addSignal(p); this.signals = p;'],
			['[ \t]*end[ ]*',
				0,
				'if(!(this.signals instanceof SimpleContainer)) res[0]=null;'
				+ 'else this.signals = this.signals.getParent();'],
			
			['[ \t]*autonumber[ ]*([0-9]+)[ ]*',
				1,
				'this.autonumber = res[1];'],
			['[ \t]*autonumber[ ]*off[ ]*',
				0,
				'this.autonumber = null;'],
			['[ \t]*state[ ]*over[ ]*([^: ]*)[ ]*:[ ]*(.*)',
				2,
				'this.addParticipant(new Participant(res[1]));'
				+ 'this.addSignal(new State(this.getParticipant(res[1]), res[2]));'],
			['[ \t]*([^- ]*)[ ]*(-)?->[ ]*([^: ]*)[ ]*:[ ]*(.*)',
				4,
				'this.addParticipant(new Participant(res[1]));'
				+ 'this.addParticipant(new Participant(res[3]));'
				+ 'this.addSignal(new Signal(this.getParticipant(res[1]), this.getParticipant(res[3]), res[4], res[2]=="-"))'],
			['[ \t]*', 0, '']
		];
		this.autonumber = null;
	
		this.addParticipant = function(participant) {
			found = false;
			for(var i in this.participants) {
				if(this.participants[i].name === participant.name) {
					found = true;
					break;
				}
			}
			if(!found) {
				this.participants.push(participant);
			}
		}
	
		this.addSignal = function(signal) {
			if(this.autonumber != null
					&& signal.text != undefined
					&& !(signal instanceof State)) {
				signal.text[0] = "["+this.autonumber+"] " + signal.text[0];
				this.autonumber++;
			}
			if(this.parallel != null) {
				this.parallel.addSignal(signal);
			} else {
				this.signals.addSignal(signal);
			}
		}
	
		this.getParticipant = function(name) {
			for(var i in this.participants) {
				if(this.participants[i].name === name) {
					return this.participants[i];
				}
			}
			return null;
		}
	
		this.parseLines = function(lines) {
			var retour = "";
			var tab = lines.split("\n");
			for(var i in tab) {
				var found = this.parseLine(tab[i]);
				if(!found) {
					retour += 'E: line ' + (parseInt(i)+1) + '<br/>';
				}
			}
			if(this.signals.getParent() != null) {
				retour += 'E: missing closing \'end\' tag before the end of the code<br/>';
			}
			return retour;
		}
	
		this.parseLine = function(line) {
			for(var i in this.patterns) {
				var pat = new RegExp(this.patterns[i][0]);
				line = filter(line);
				var res = pat.exec(line);
				if(res != null && res.length-1 == this.patterns[i][1]) {
					eval(this.patterns[i][2]);
					if(res[0] === line) {
						return true;
					}
				}
			}
			return false;
		}
	
		this.getSVG = function() {
			var svg = '';
		
			//Calculate the height
			var heightParticipants = 0;
			for(var i in this.participants) {
				if(this.participants[i].height > heightParticipants) {
					heightParticipants = this.participants[i].height;
				}
			}
			var height = heightParticipants;
			height += this.signals.getHeight();
		
			var width = (this.participants.length * (partSize+interPart)) - interPart + 10;
		
			for(var i in this.participants) {
				this.participants[i].position = i;
				svg += this.participants[i].getSVG(height);
			}
			height += heightParticipants;
			svg += this.signals.getSVG(heightParticipants, width);
		
			var finalSVG =
				'<svg  xmlns="http://www.w3.org/2000/svg" version="1.1" width="'
				+ width
				+ '" height="'
				+ (height + 10)
				+ '">';
			finalSVG += '<defs>';
			finalSVG += gradient('grad1');
			finalSVG += '</defs>';
			finalSVG += svg;
			finalSVG += '</svg>';
			return finalSVG;
		}
	}
	
	//Public API
	
	var _schema = null;
	var _errors = null;
	var parse = function(text) {
		_schema = new Schema();
		_errors = _schema.parseLines(text);
	};
	
	var getErrors = function() {
		return _errors;
	};
	
	var getSVG = function() {
		return _schema.getSVG();
	};
	
	return {parse: parse, getErrors: getErrors, getSVG: getSVG};
})();
