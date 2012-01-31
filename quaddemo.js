// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

DraggableBox = c.inherit({

  initialize: function(x, y, w, h) {
    this.width = w || 15;
    this.height = h || 15;
    if (y == null ) {
      this.center = new c.Point(0, 0, x);
    } else {
      this.center = new c.Point(x, y);
    }
    this.cvt();
  },

  cvt: function() {
    this.sx = Math.floor(this.center.Xvalue());
    this.sy = Math.floor(this.center.Yvalue());
  },

  draw: function(ctx) {
    this.cvt();
    ctx.strokeRect(this.sx - (this.width/2), this.sy - (this.height/2), 
                   this.width, this.height);
  },

  SetCenter: function(x, y) {
    this.center.SetXY(x, y);
  },

  SetSize: function(w, h) {
    this.width = w;
    this.height = h;
  }, 

  CenterX: function() {
    return this.center.Xvalue();
  },

  CenterY: function() {
    return this.center.Yvalue();
  },

  X: function() {
    return this.center.x;
  },

  Y: function() {
    return this.center.y;
  },

  CenterPt: function() {
    return this.center;
  },

  Contains: function(x, y) {
    return ( (x >= this.sx - this.width/2) && (x <= this.sx + this.width/2) &&
             (y >= this.sy - this.height/2) && (y <= this.sy + this.height/2) );
  },

  toString: function() {
    return "<" + this.sx + "," + this.sy + ">";
  },
});

var QuadDemo = c.inherit({

  initialize: function() {
    this.canvas = document.getElementById('c');
    this.cwidth = this.canvas.width;
    this.cheight = this.canvas.height;
    this.g = this.canvas.getContext('2d');
    
    var solver = this.solver = new c.SimplexSolver();
    this.dbDragging = -1;
    
    var db = this.db = new Array(8);   // all of them
    var mp = this.mp = new Array(4);   // midpoints
    
    var a;

    for (a = 0; a < 8; ++a) {
      db[a] = new DraggableBox(a);
    }

    for (a = 0; a < 4; ++a) {
      mp[a] = db[a+4];
    }
    
    db[0].SetCenter(10, 10);
    db[1].SetCenter(10, 200);
    db[2].SetCenter(200, 200);
    db[3].SetCenter(200, 10);
    
    // Add constraints
    //  try {
    // Add stay constraints on line endpoints
    solver.addPointStays([db[0].CenterPt(),
                          db[1].CenterPt(),
                          db[2].CenterPt(),
                          db[3].CenterPt()]);
    
    var cle, cleq;

    // Add constraints to keep midpoints at line midpoints
    cle = new c.LinearExpression(db[0].X());
    cle = (cle.plus(db[1].X())).divide(2);
    cleq = new c.LinearEquation(mp[0].X(), cle);

    solver.addConstraint(cleq);
    cle = new c.LinearExpression(db[0].Y());
    cle = (cle.plus(db[1].Y())).divide(2);
    cleq = new c.LinearEquation(mp[0].Y(), cle);

    solver.addConstraint(cleq);
    
    cle = new c.LinearExpression(db[1].X());
    cle = (cle.plus(db[2].X())).divide(2);
    cleq = new c.LinearEquation(mp[1].X(), cle);

    solver.addConstraint(cleq);
    cle = new c.LinearExpression(db[1].Y());
    cle = (cle.plus(db[2].Y())).divide(2);
    cleq = new c.LinearEquation(mp[1].Y(), cle);

    solver.addConstraint(cleq);
    
    cle = new c.LinearExpression(db[2].X());
    cle = (cle.plus(db[3].X())).divide(2);
    cleq = new c.LinearEquation(mp[2].X(), cle);

    solver.addConstraint(cleq);
    cle = new c.LinearExpression(db[2].Y());
    cle = (cle.plus(db[3].Y())).divide(2);
    cleq = new c.LinearEquation(mp[2].Y(), cle);

    solver.addConstraint(cleq);
    
    cle = new c.LinearExpression(db[3].X());
    cle = (cle.plus(db[0].X())).divide(2);
    cleq = new c.LinearEquation(mp[3].X(), cle);

    solver.addConstraint(cleq);
    cle = new c.LinearExpression(db[3].Y());
    cle = (cle.plus(db[0].Y())).divide(2);
    cleq = new c.LinearEquation(mp[3].Y(), cle);

    solver.addConstraint(cleq);
    

    cle = c.Plus(db[0].X(),20);
    solver
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[2].X()))
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[3].X()));
    
    cle = c.Plus(db[1].X(),20);
    solver
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[2].X()))
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[3].X()));

    cle = c.Plus(db[0].Y(),20);
    solver
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[1].Y()))
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[2].Y()));

    cle = c.Plus(db[3].Y(),20);
    solver
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[1].Y()))
      .addConstraint(new c.LinearInequality(cle,c.LEQ,db[2].Y()));

    // Add constraints to keep points inside window
    solver.addConstraint(new c.LinearInequality(db[0].X(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[0].Y(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[1].X(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[1].Y(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[2].X(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[2].Y(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[3].X(), c.GEQ, 10));
    solver.addConstraint(new c.LinearInequality(db[3].Y(), c.GEQ, 10));
    
    solver.addConstraint(new c.LinearInequality(db[0].X(), c.LEQ, this.cwidth - 10));
    solver.addConstraint(new c.LinearInequality(db[0].Y(), c.LEQ, this.cheight - 10));
    solver.addConstraint(new c.LinearInequality(db[1].X(), c.LEQ, this.cwidth - 10));
    solver.addConstraint(new c.LinearInequality(db[1].Y(), c.LEQ, this.cheight - 10));
    solver.addConstraint(new c.LinearInequality(db[2].X(), c.LEQ, this.cwidth - 10));
    solver.addConstraint(new c.LinearInequality(db[2].Y(), c.LEQ, this.cheight - 10));
    solver.addConstraint(new c.LinearInequality(db[3].X(), c.LEQ, this.cwidth - 10));
    solver.addConstraint(new c.LinearInequality(db[3].Y(), c.LEQ, this.cheight - 10));

    //  } catch (e) {
    //    print("EXCEPTION: e = " + e);
    //  }
  },

  mousedown: function(ev) {
    var x = ev.pageX - this.canvas.offsetLeft;
    var y = ev.pageY - this.canvas.offsetTop;

    // console.log('mousedown x,y='+x+','+y);
    // console.log('mousedown canvasoffset='+this.canvas.offsetLeft+','+this.canvas.offsetTop);
    // console.log('mousedown clientx,y='+ev.clientX+','+ev.clientY);
    // console.log('mousedown pagex,y='+ev.pageX+','+ev.pageY);
    //
    for ( var a = 0; a < this.db.length; a++ ) {
      if ( this.db[a].Contains(x, y) ) {
        this.dbDragging = a;
        // console.log('dragging #' + a);
        break;
      }
    }

    if ( this.dbDragging != -1 ) {
      this.draw();
//      try {
        this.solver
          .addEditVar(this.db[this.dbDragging].X())
          .addEditVar(this.db[this.dbDragging].Y())
          .beginEdit();
//      } catch (ex) {
//        console.log("mouseDown exception = " + ex);
//      }
    }
    return true;
  },


  mouseup: function(ev) {
    if (this.dbDragging != -1 ) {
//      try {
        this.dbDragging = -1;
        this.solver.endEdit();
//      } catch (ex) {
//        console.log("mouseup exception = " + ex);
//      }
    }
    this.draw();
    return true;
  },

  mousemove: function(ev) {
    var x = ev.pageX - this.canvas.offsetLeft;
    var y = ev.pageY - this.canvas.offsetTop;
    if ( this.dbDragging != -1 ) {

//      try {

      this.solver
        .suggestValue(this.db[this.dbDragging].X(),x)
        .suggestValue(this.db[this.dbDragging].Y(),y)
        .resolve();

//      } catch (ex) {
//        console.log("mousemove: ex = " + ex);
//      }

      this.draw();
    }
    return true;
  },


  touchstart: function(ev) {
    if (false) {
      document.write("touchstart ev = " + ev + "  ");
      document.write(ev.pageX + "," + ev.pageY);
      document.write("<br/>");
    }
    this.mousedown(ev.touches.item(0));
    if (this.dbDragging != -1) {
      ev.preventDefault();
    }
  },

  touchend: function(ev) {
    if (false) {
      document.write("touchend ev = " + ev + "  ");
      document.write(ev.pageX + "," + ev.pageY);
      document.write("<br/>");
    }
    this.mouseup(ev);
  },

  touchmove: function(ev) {
    if (false) {
      document.write("touchmove ev = " + ev + "  ");
      document.write(ev.pageX + "," + ev.pageY);
      document.write("<br/>");
    }
    this.mousemove(ev.touches.item(0));
    if (this.dbDragging != -1) {
      ev.preventDefault();
    }
  },

  initEvents: function() {
    var mouseupHandler = function(ev) {
      this.mouseup(ev);
      document.removeEventListener('mouseup', mouseupHandler);
    }.bind(this);

    this.canvas.addEventListener('mousedown', 
      function(ev) {
       this.mousedown(ev);                                   
       document.addEventListener('mouseup', mouseupHandler);                                   
      }.bind(this),
      false
    );
    ['mousemove', 'touchstart', 'touchend', 'touchmove'].forEach(
      function(evt) {
        this.canvas.addEventListener(evt, this.mousemove.bind(this));
      },
      this
    );
  },
  
  
  draw: function() {
    var g = this.g;
    var db = this.db;
    var mp = this.mp;

    g.clearRect(0, 0, this.cwidth, this.cheight);
    g.strokeStyle = 'black';

    g.beginPath();
    g.moveTo(db[0].CenterX(), db[0].CenterY());
    g.lineTo(db[1].CenterX(), db[1].CenterY());
    g.lineTo(db[2].CenterX(), db[2].CenterY());
    g.lineTo(db[3].CenterX(), db[3].CenterY());
    g.closePath();
    g.stroke();

    g.beginPath();
    g.moveTo(mp[0].CenterX(), mp[0].CenterY());
    g.lineTo(mp[1].CenterX(), mp[1].CenterY());
    g.lineTo(mp[2].CenterX(), mp[2].CenterY());
    g.lineTo(mp[3].CenterX(), mp[3].CenterY());
    g.closePath();
    g.stroke();

    for (var a = 0; a < 8; ++a) {
      if (a == this.dbDragging) {
        g.strokeStyle = 'blue';
      }
      db[a].draw(g);
      if (a == this.dbDragging) {
        g.strokeStyle = 'black';
      }
    }
  },
});

function runit() {
  var qd = new QuadDemo();
  document.getElementById("append").innerHTML = ("<br/>" + qd.solver.getInternalInfo());
  qd.draw();
  qd.initEvents();
}
