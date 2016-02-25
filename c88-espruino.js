// States
C88_STATE_READY = 0;
C88_STATE_STOP  = 1;
C88_STATE_HALT  = 2;

// Helpers
function signed(i)
{
  if ( i > 127 )
    return i - (128*2);
  else
    return i;
}

// Create the hardware!
function c88()
{
  this.instr = [];

  this.instr[0] = function(i) { this.reg = this.mem[i]; };	// LOAD
  this.instr[1] = function(i) {					// SWAP
    v = this.reg;
    this.reg = this.mem[i];
    this.mem[i] = v;
  };
  this.instr[2] = function(i) { this.mem[i] = this.reg; };	// STORE
  this.instr[3] = function(i) { this.state = C88_STATE_STOP; };	// STOP

  this.instr[4] = function(i) { if(this.mem[i] > this.reg) ++this.pc; };	// TSG
  this.instr[5] = function(i) { if(this.mem[i] < this.reg) ++this.pc; };	// TSL
  this.instr[6] = function(i) { if(this.mem[i] == this.reg) ++this.pc; };	// TSE
  this.instr[7] = function(i) { if(this.mem[i] != this.reg) ++this.pc; };	// TSI

  this.instr[8] = function(i) { this.pc = i - 1; };		// JMP
  this.instr[9] = function(i) { this.pc = this.mem[i] - 1; };	// JMA
  this.instr[10]= function(i) { this.state = C88_STATE_HALT; }; // Unused
  this.instr[11]= function(i) { this.state = C88_STATE_HALT; }; // Unused

  this.instr[12]= function(i) { this.out = this.reg; };		// IOW
  this.instr[13]= function(i) { this.reg = this.in; };		// IOR
  this.instr[14]= function(i) {					// IOS
    this.out = this.reg;
    this.reg = this.in;
  };
  this.instr[15]= function(i) { this.out = 0; };		// IOC

  this.instr[16]= function(i) { this.reg += this.mem[i]; };	// ADD
  this.instr[17]= function(i) { this.reg -= this.mem[i]; };	// SUB
  this.instr[18]= function(i) {					// MUL
    r = signed( this.reg );
    m = signed( this.mem[i] );
    this.reg = r * m;
  };
  this.instr[19]= function(i) {					// DIV
    r = signed( this.reg );
    m = signed( this.mem[i] );
    this.reg = r / m;
  };

  this.instr[20]= function(i) { this.reg <<= i; };		// SHL
  this.instr[21]= function(i) { this.reg >>= i; };		// SHR
  this.instr[22]= function(i) {					// ROL
    v = ( (this.reg << 8) | this.reg );
    this.reg = v >> (8 - i);
  };
  this.instr[23]= function(i) {					// ROR
    v = ( (this.reg << 8) | this.reg );
    this.reg = v >> i;
  };

  this.instr[24]= function(i) { this.reg += this.mem[i]; };	// ADDU*
  this.instr[25]= function(i) { this.reg -= this.mem[i]; };	// SUBU*
  this.instr[26]= function(i) { this.reg *= this.mem[i]; };	// MULU
  this.instr[27]= function(i) { this.reg /= this.mem[i]; };	// DIVU

  this.instr[28]= function(i) { this.reg += 1; };		// INC
  this.instr[29]= function(i) { this.reg -= 1; };		// DEC
  this.instr[30]= function(i) { this.reg = signed(this.reg) * 2; };		// DOUBLE
  this.instr[31]= function(i) { this.reg = signed(this.reg) / 2; };		// HALF

  this.debug = [];

  this.debug[0]= function(i) { return "LOAD  " + i; };
  this.debug[1]= function(i) { return "SWAP  " + i; };
  this.debug[2]= function(i) { return "STORE " + i; };
  this.debug[3]= function(i) { return "STOP"; };
  this.debug[4]= function(i) { return "TSG   " + i; };
  this.debug[5]= function(i) { return "TSL   " + i; };
  this.debug[6]= function(i) { return "TSE   " + i; };
  this.debug[7]= function(i) { return "TSI   " + i; };

  this.debug[8]= function(i) { return "JMP   " + i; };
  this.debug[9]= function(i) { return "JMA   " + i; };
  this.debug[10]=function(i) { return "ILLEGAL OPCODE"; };
  this.debug[11]=function(i) { return "ILLEGAL OPCODE"; };
  this.debug[12]=function(i) { return "IOW"; };
  this.debug[13]=function(i) { return "IOR"; };
  this.debug[14]=function(i) { return "IOS"; };
  this.debug[15]=function(i) { return "IOC"; };

  this.debug[16]=function(i) { return "ADD   " + signed(i); };
  this.debug[17]=function(i) { return "SUB   " + signed(i); };
  this.debug[18]=function(i) { return "MUL   " + signed(i); };
  this.debug[19]=function(i) { return "DIV   " + signed(i); };
  this.debug[20]=function(i) { return "SHL   " + i; };
  this.debug[21]=function(i) { return "SHR   " + i; };
  this.debug[22]=function(i) { return "ROL   " + i; };
  this.debug[23]=function(i) { return "ROR   " + i; };

  this.debug[24]=function(i) { return "ADDU  " + i; };
  this.debug[25]=function(i) { return "SUBU  " + i; };
  this.debug[26]=function(i) { return "MULU  " + i; };
  this.debug[27]=function(i) { return "DIVU  " + i; };
  this.debug[28]=function(i) { return "INC"; };
  this.debug[29]=function(i) { return "DEC"; };
  this.debug[30]=function(i) { return "DOUBLE"; };
  this.debug[31]=function(i) { return "HALF"; };

  this.debugmode = false;

  this.nextinst = function() {
    inst = this.mem[this.pc];
    op = inst >> 3;
    op &= 0x1F;
    imm = inst & 7;

    this.d = this.debug[op];
    return "" + this.pc + ": " + this.d(imm);
  };

  this.dumpstate = function() {
    return "  REG = " + this.reg + "\n" +
           "  PC  = " + this.pc + "\n" +
           "  MEM = " + this.mem;
  };

  // Execute the next instruction
  this.step = function() {
    if (this.state != C88_STATE_READY) return;

    if (this.debugmode) {
      console.log(this.nextinst());
    }

    inst = this.mem[this.pc];
    op = inst >> 3;
    op &= 0x1F;
    imm = inst & 7;

    this.f = this.instr[op];
    this.f(imm);

    this.reg &= 0xff;

    ++this.pc;
    this.pc &= 0x7;

    if (this.debugmode) {
      console.log(this.dumpstate());
    }
  };

  this.reset = function() {
    this.reg = 0;
    this.pc = 0;
    this.state = C88_STATE_READY;
  };

  this.clear = function() {
    this.mem = [0,0,0,0,0,0,0,0];
  };

  this.clear();
  this.reset();
}

var c;
var disp;
var view;
var running;

DATA_SWITCHES   = [A15, A14, A13, A10, A9, A8, C11, C10];
ADDR_SWITCHES   = [C9, C8, C7];
WRITE_BUTTON    = C6;
USER_SWITCH     = C5;
RUN_SWITCH      = C4;
PC_VIEW_BUTTON  = A1;
MEM_VIEW_BUTTON = A0;
REG_VIEW_BUTTON = C3;
SPEED_SWITCH    = C2;
STEP_BUTTON     = C15;
RESET_BUTTON    = C12;

function curSpeed(){
  if (digitalRead(SPEED_SWITCH)){
    return "fast";
  }
  return "slow";
}

function updateDisplay(){
  if (view == "MEM"){disp.raw( c.mem                                                  );}
  if (view == "PC") {disp.raw([c.pc,  c.pc,  c.pc,  c.pc,  c.pc,  c.pc,  c.pc,  c.pc ]);}
  if (view == "REG"){disp.raw([c.reg, c.reg, c.reg, c.reg, c.reg, c.reg, c.reg, c.reg]);}
}

function viewPC() {view = "PC";  updateDisplay();}
function viewMEM(){view = "MEM"; updateDisplay();}
function viewREG(){view = "REG"; updateDisplay();}

function userStep(){
  if (digitalRead(USER_SWITCH)){
     //TODO emulate fixed fetch.
     //For now just do nothing.
  }
  else{
    c.step();
  }
  updateDisplay();
}
function userReset(){
  c.reset();
  updateDisplay();
}

//Get the value of a switch bank
function getSwitchVal(switches){
  l = switches.length;
  result = 0;
  for (i = 0; i <= l-1 ; i ++){
    result |= digitalRead(switches[i])<<i;
  }
  return result;
}

function userWrite(){
  if (digitalRead(USER_SWITCH)){
    c.mem[getSwitchVal(ADDR_SWITCHES)] = getSwitchVal(DATA_SWITCHES);
  }
  updateDisplay();
}

function initListeners(){
  setWatch(userWrite, WRITE_BUTTON,    { repeat:true, edge:'rising' });

  setWatch(userStep,  STEP_BUTTON,     { repeat:true, edge:'rising', debounce:20});
  setWatch(userReset, RESET_BUTTON,    { repeat:true, edge:'rising' });

  setWatch(viewPC,    PC_VIEW_BUTTON,  { repeat:true, edge:'rising' });
  setWatch(viewMEM,   MEM_VIEW_BUTTON, { repeat:true, edge:'rising' });
  setWatch(viewREG,   REG_VIEW_BUTTON, { repeat:true, edge:'rising' });
}

function scheduleStep(){
  if (curSpeed() == "slow"){
    setTimeout(cStep, 70);
  }
  else{
    setTimeout(cStep, 1);
  }
}

function cStep(){
  if (digitalRead(RUN_SWITCH)){
    userStep();
  }
  scheduleStep();
}

function onInit(){
  SPI2.setup({mosi:B15, sck:B13});
  disp = require("MAX7219").connect(SPI2,B14);
  c = new c88();
  view = "MEM";
  initListeners();
  setTimeout(cStep, 0.2);
}
