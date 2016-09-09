/*global c*/
/**
 * [c1, c2, c3, c4] for corners starting from top left clockwise
 * [m1, m2, m3, m4] for midpoints starting from top clockwise
 */
var expressions = [
    // midpoints constrained in corners
    '(c1x + c2x) / 2 == m1x', '(c1y + c2y) / 2 == m1y',
    '(c2x + c3x) / 2 == m2x', '(c2y + c3y) / 2 == m2y',
    '(c4x + c3x) / 2 == m3x', '(c4y + c3y) / 2 == m3y',
    '(c1x + c4x) / 2 == m4x', '(c1y + c4y) / 2 == m4y',

    // spaces between points
    'c1x + 20 <= c2x', 'c1x + 20 <= c3x',
    'c4x + 20 <= c2x', 'c4x + 20 <= c3x',
    'c1y + 20 <= c3y', 'c1y + 20 <= c4y',
    'c2y + 20 <= c3y', 'c2y + 20 <= c4y',

    // contained inside canvas
    'c1x >= 0', 'c2x >= 0', 'c3x >= 0', 'c4x >= 0',
    'c1y >= 0', 'c2y >= 0', 'c3y >= 0', 'c4y >= 0',
    'c1x <= 800', 'c2x <= 800', 'c3x <= 800', 'c4x <= 800',
    'c1y <= 600', 'c2y <= 600', 'c3y <= 600', 'c4y <= 600',
].join(';');

var cOut = c(expressions);
var solver = c('solver');


/**
 * Point - holds c.Variable coordinate representing a point
 */
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
    }

    // checks if a given coordinate is inside the box representing the point
    contains(x, y) {
        return (Math.abs(x - this.x.value) <= this.size/2 &&
                Math.abs(y - this.y.value) <= this.size/2);
    }

    // draws a box representing the point
    draw(ctx) {
        var z = this.size;
        ctx.strokeRect(this.x.value - z/2, this.y.value - z/2, z, z);
    }

    // sets stay value on the point
    stay(x, y) {
        this.x.value = x;
        this.y.value = y;
        solver.addStay(this.x).addStay(this.y);
    }

    // makes point coordinate variables editable
    edit() {
        return solver.addEditVar(this.x).addEditVar(this.y);
    }

    // suggests coordinate values for the point
    suggest(x, y) {
        return solver.suggestValue(this.x, x).suggestValue(this.y, y);
    }
}



/**
 * Application
 */
var App = {
    init: function() {
        this.canvas = document.getElementById('c');
        this.cwidth = this.canvas.width;
        this.cheight = this.canvas.height;
        this._ctx = this.canvas.getContext('2d');
        this._dragPoint = null;

        // populating corners, midpoints
        var ps = this.points = [];
        var cs = this.corners = [];
        var ms = this.midpoints = [];
        var point;
        for(var i=1; i<=4; i++) {
            point = new Point(c(`c${i}x`), c(`c${i}y`));
            cs.push(point);
            ps.push(point);

            point = new Point(c(`m${i}x`), c(`m${i}y`));
            ms.push(point);
            ps.push(point);
        }

        // set initial position
        cs[0].stay(100, 100);
        cs[1].stay(400, 100);
        cs[2].stay(400, 400);
        cs[3].stay(100, 400);
        ms[0].stay(250, 100);
        ms[1].stay(400, 250);
        ms[2].stay(250, 400);
        ms[3].stay(100, 250);

        this.draw();

        this._bindEvents();
    },

    draw: function() {
        var g = this._ctx;
        g.clearRect(0, 0, this.cwidth, this.cheight);
        g.strokeStyle = 'black';

        this.points.forEach(function(point) { point.draw(g); });

        this._drawLine(this.midpoints);
        this._drawLine(this.corners);
    },

    _drawLine: function(points) {
        var g = this._ctx;

        g.beginPath();
        g.moveTo(points[0].x.value, points[0].y.value);
        g.lineTo(points[1].x.value, points[1].y.value);
        g.lineTo(points[2].x.value, points[2].y.value);
        g.lineTo(points[3].x.value, points[3].y.value);
        g.closePath();
        g.stroke();
    },

    _bindEvents: function() {
        this.canvas.addEventListener('mousedown', ev => this._mousedown(ev));
        document.body.addEventListener('mousemove', ev => this._mousemove(ev));
        document.body.addEventListener('mouseup', ev => this._mouseup(ev));
    },

    _mousedown: function(ev) {
        var x = ev.pageX - this.canvas.offsetLeft;
        var y = ev.pageY - this.canvas.offsetTop;

        for(var i=0; i<this.points.length; i++) {
            if(this.points[i].contains(x, y)) {
                this._dragPoint = this.points[i];
                this._dragPoint.edit().beginEdit();
                document.body.style.cursor = 'move';
            }
        }
    },

    _mousemove: function(ev) {
        if(!this._dragPoint) return;

        var x = ev.pageX - this.canvas.offsetLeft;
        var y = ev.pageY - this.canvas.offsetTop;
        this._dragPoint.suggest(x, y).resolve();
        this.draw();
    },

    _mouseup: function(ev) {
        if(this._dragPoint) {
            solver.endEdit();
            document.body.style.cursor = '';
        }
        this._dragPoint = null;
    }
};
App.init();
