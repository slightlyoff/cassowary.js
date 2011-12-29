(function(c) {

Timer = c.inherit(
  function() {
    this._timerIsRunning = false;
    this._elapsedMs = 0;
  },
  null,
  {
    Start: function() {
      this._timerIsRunning = true;
      this._startReading = new Date();
    },

    Stop: function() {
      this._timerIsRunning = false;
      this._elapsedMs += (new Date()) - this._startReading;
    },

    Reset: function() {
      this._timerIsRunning = false;
      this._elapsedMs = 0;
    }, 

    IsRunning : function() {
      return this._timerIsRunning;
    },

    ElapsedTime : function() {
      if (!this._timerIsRunning) {
        return this._elapsedMs/1000;
      } else {
        return (this._elapsedMs+(new Date()-this._startReading))/1000;
      }
    },
  }
);

})(CL);
