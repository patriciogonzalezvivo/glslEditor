'use strict';

import Picker from './Picker'
import Vector from './Vector';
import Matrix from './Matrix';
import { addEvent, removeEvent } from './events'

let domCache;

export default class DirectionPicker extends Picker {
    constructor (dir, properties) {
        super('trackpad-', properties);

        this.width = this.width || 200;
        this.height = this.width || 200;
        this.fnColor = this.fnColor || 'rgb(230, 230, 230)';
        this.dimColor = this.dimColor || 'rgb(100, 100, 100)';
        this.dragScale = 50;

        this.setValue(dir || [0,0,1]);
        this.create();
        
        this.camera = new Matrix();
        this.shapes = [];
        this.center = [0, 0, 0];

        this.shapes.push({
            edgeColour: this.dimColor,
            nodes: [[this.width/2-50, this.height/2, 100], [this.width/2+50,  this.height/2,  100],
                    [this.width/2, this.height/2-50, 100], [this.width/2, this.height/2+50, 100],
                    [this.width/2, this.height/2, 50], [this.width/2, this.height/2, 150] ],
            edges: [[0,1], [2,3], [4,5]]
        });

        this.shapes.push({
            textColour: this.fnColor,
            nodes: [[this.width/2+68, this.height/2, 100], [this.width/2-68, this.height/2, 100], 
                    [this.width/2, this.height/2+68, 100], [this.width/2, this.height/2-68, 100], 
                    [this.width/2, this.height/2, 168], [this.width/2, this.height/2, 32] ],
            text: ["x", "-x", "y", "-y", "z", "-z"]
        });

        this.setCenter(this.width/2,this.height/2,100);

        // Mouse events
        this.dragOffset = [0, 0];
        this.overPoint = false;
    }

    setCenter (x, y, z) {
        for (let s in this.shapes) {
            let shape = this.shapes[s];
            
            for (let n in shape.nodes) {
                shape.nodes[n][0] -= x;
                shape.nodes[n][1] -= y;
                shape.nodes[n][2] -= z;
            }
        }
        this.center = [x, y, z];
    }

    viewFromCamera (node) {
        let A = this.camera.getMult(node);
        A.add(this.center);
        return [A.x, this.height - A.y];
    };

	draw () {    
        this.ctx.clearRect(0,0,this.width,this.height);

        for (let s in this.shapes) {
            let shape = this.shapes[s];
            if (shape.edgeColour) {
                this.drawShapeEdges(shape);
            }
            if (shape.nodeColour) {
                this.drawShapeNodes(shape);
            }
            if (shape.text) {
                this.drawShapeText(shape);
            }
        }

        this.drawShapeEdges({
            edgeColour: this.fnColor,
            nodes: [[0,0,0], this.point],
            edges: [[0,1]]
        });

        this.drawShapeNodes({
            nodeColour: this.overPoint? '#28A86B' : this.fnColor,
            nodeRadius: this.overPoint? 4 : 2,
            nodes: [this.point]
        });
	}

    drawShapeEdges (shape) {
        let nodes = shape.nodes;
        console.log(nodes);
        this.ctx.strokeStyle = shape.edgeColour;
        for (let e in shape.edges) {
            let coord = this.viewFromCamera(nodes[shape.edges[e][0]]);
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(coord[0], coord[1]);
            coord = this.viewFromCamera(nodes[shape.edges[e][1]]);
            this.ctx.lineTo(coord[0], coord[1]);
            this.ctx.stroke();
        }
    }

    drawShapeNodes (shape) {
        let radius = shape.nodeRadius || 4;
        this.ctx.fillStyle = shape.nodeColour;
        for (let n in shape.nodes) {
            let coord = this.viewFromCamera(shape.nodes[n]);
            this.ctx.beginPath();
            this.ctx.arc(coord[0], coord[1], radius, 0 , 2 * Math.PI, false);
            this.ctx.fill();
        }
    }

    drawShapeText (shape) {        
        this.ctx.fillStyle = shape.textColour;
        for (let n in shape.nodes) {
            let coord = this.viewFromCamera(shape.nodes[n]);
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(shape.text[n], coord[0], coord[1]);
        }
    }

    onMouseDown (event) {
        let mouse = [event.offsetX, event.offsetY];
        this.dragOffset = mouse;

        let pos = new Vector(this.viewFromCamera(this.point));
        let diff = pos.getSub(mouse);
        this.overPoint = diff.getLength() < 10;

        super.onMouseDown(event);
        this.onMouseUpHandler = addEvent(this.el, 'dblclick', this.onDbClick, this);
    }

    // Actions when user moves around on HSV color map
    onMouseMove (event) {
        let x = event.offsetX;
        let y = event.offsetY;

        var dx = 0.01 * (x - this.dragOffset[0]);
        var dy = 0.01 * (y - this.dragOffset[1]);

        if (this.overPoint) {
            let invM = this.camera.getInv();
            let vel = invM.getMult([dx,-dy,-0.00001]);
            this.value.add(vel);
            this.value.normalize();
            this.point = [this.value.x*this.dragScale, this.value.y*this.dragScale, this.value.z*this.dragScale];
        }
        else {
            this.camera.rotateX(dy);
            this.camera.rotateY(dx); 
        }
        
        this.dragOffset = [x, y];

        // fire 'changed'
        if (this.listeners.changed && typeof this.listeners.changed === 'function') {
            this.listeners.changed(this.value);
        }
    }

    onDbClick (event) {
        this.camera = new Matrix();
        this.draw();
    }

    destroyEvents () {
        super.destroyEvents()
        removeEvent(this.el, 'dblclick', this.onDbClick);
        this.onMouseMoveHandler = null;
    }

    setValue (dir) {
        this.value = new Vector(dir);
        this.value.normalize();
        this.point = [this.value.x*this.dragScale, this.value.y*this.dragScale, this.value.z*this.dragScale];
    }
}

