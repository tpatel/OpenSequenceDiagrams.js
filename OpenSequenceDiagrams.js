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

//Constansts ------------------------------------------------------------------

var partSize = 125; //Participant width
var interPart = 25; //Horizontal interval between 2 participants

//SVG functions ---------------------------------------------------------------

function drawText(x, y, text) {
	return '<text x="'+x+'" y="'+ y + '" style="text-anchor:middle;">'+text+'</text>';
}

function drawRect(x, y, width, height, ry, gradient) {
	return '<rect'
			+ ' x="' + x
			+ '" y="' + y
			+ '" width="' + width
			+ '" height="' + height
			+ '" ry="' + ry
			+ '" style="fill:' + (gradient ? 'url(#grad1)' : 'white') + ';stroke:black;stroke-width:2;" ></rect>';
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
	r+= drawRect(0, 0, partSize, end, 5, gradient);
	for(var i in text) {
		r+= drawText(partSize/2, i*20+20, text[i]);
	}
	r+='</g>';
	return r;
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
		r+= drawText((partSize+interPart)*width/2, i*20, text[i]);
	}
	r+='</g>';
	return r;
}


//Model -----------------------------------------------------------------------

function filter(text) {
	return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

//Participant

function Participant(name, text) {
	this.name = filter(name);
	if(text == undefined) {
		this.text = filter(name).split("\\n");
	} else {
		this.text = filter(text).split("\\n");
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
	this.text = filter(text).split("\\n");
	this.isDotted = isDotted;
	this.height = this.text.length*20+10;
	if(participant1.name == participant2.name) {
		this.height += 20;
	}
	
	this.getHeight = function() {
		return this.height;
	}
	
	this.getSVG = function(position) {
		var minPosition = Math.min(this.participant1.position,
				this.participant2.position);
		return arrow(minPosition*(partSize+interPart)+5+partSize/2,
				position,
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
	this.text = filter(text).split("\\n");
	this.height = this.text.length*20+15;
	
	this.getHeight = function() {
		return this.height;
	}
	
	this.getSVG = function(position) {
		return rectWithText(
				this.participant.position*(partSize+interPart)+5,
				position,
				this.text,
				false);
	}
}

//Container

function Container() {
	this.children = [];
	this.height = 0;
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

Container.prototype.getSVG = function(position) {
	var svg = "";
	for(var i in this.children) {
		svg += this.children[i].getSVG(position);
		position += this.children[i].getHeight();
	}
	return svg;
}

//Parallel container

function ParallelContainer() {
	Container.call(this);
}

ParallelContainer.prototype = new Container();

ParallelContainer.prototype.getHeight = function() {
	var height = this.height;
	var maxHeight = 0;
	for(var i in this.children) {
		if(this.children[i].getHeight() > maxHeight) {
			maxHeight = this.children[i].getHeight();
		}
	}
	return height+maxHeight;
}

ParallelContainer.prototype.getSVG = function(position) {
	var svg = "";
	for(var i in this.children) {
		svg += this.children[i].getSVG(position);
	}
	return svg;
}

//Schema

function Schema() {
	this.participants = [];
	this.signals = new Container();
	this.patterns = [
		['[ \t]*participant[ ]*"([^"]*)"[ ]*as[ ]*"?([^"]*)"?',
			2,
			'this.addParticipant(new Participant(res[2], res[1]));'],
		['[ \t]*participant[ ]*"?([^"]*)"?',
			1,
			'this.addParticipant(new Participant(res[1]));'],
		['[ \t]*parallel[ ]*{[ ]*',
			0,
			'var p = new ParallelContainer(); this.addSignal(p); this.parallel = p;'],
		['[ \t]*}[ ]*',
			0,
			'this.parallel = null;'],
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
	this.parallel = null;
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
		if(this.autonumber != null) {
			if(signal.text != undefined) {
				signal.text[0] = "["+this.autonumber+"] " + signal.text[0];
				this.autonumber++;
			}
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
				retour += 'E: line ' + (parseInt(i)+1) + ' (' + tab[i] + ')<br/>';
			}
		}
		return retour;
	}
	
	this.parseLine = function(line) {
		if(line === "") {
			return true;
		}
		for(var i in this.patterns) {
			var pat = new RegExp(this.patterns[i][0]);
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
		
		for(var i in this.participants) {
			this.participants[i].position = i;
			svg += this.participants[i].getSVG(height);
		}
		height += heightParticipants;
		svg += this.signals.getSVG(heightParticipants);
		
		var finalSVG =
			'<svg  xmlns="http://www.w3.org/2000/svg" version="1.1" width="'
			+ (this.participants.length * (partSize+interPart))
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
