var statusdiv=false;
var lastenemytype="";
var statusinfo=new Object;
var statuswindowpos1 = 0, statuswindowpos2 = 0, statuswindowpos3 = 0, statuswindowpos4 = 0;
statusinfo.startgold=character.gold;
statusinfo.starttime=Date.now()/1000;
statusinfo.levelstarttime=Date.now()/1000;
statusinfo.startxp=character.xp;
statusinfo.doingwhat="starting";
statusinfo.goldtracking=[];
statusinfo.lastenemy=lastenemytype;
statusinfo.charlevel=character.level;



parent.$("body").find("#genericnoobstatuswindow").remove();
function updatewindow()
{	
    if (!statusdiv){
		console.log("create the status window");
        var tempdiv = document.createElement("div");
        tempdiv.id = "genericnoobstatuswindow";
        tempdiv.innerHTML = "testing<br/>testing<br/>testing";
        tempdiv.style.backgroundColor ="#121200";
        tempdiv.style.color="#ffffff";
		tempdiv.style.opacity=0.7;
        tempdiv.style.fontFamily="monospace";
        tempdiv.style.fontSize="1.1em";
        tempdiv.style.fontWeight=900;
        tempdiv.style.zIndex=2147483647;
        tempdiv.style.position="absolute";
        tempdiv.style.top="0px";
        tempdiv.style.left="0px";
        tempdiv.style.padding="5px";
        tempdiv.style.margin="0px";
        tempdiv.style.borderColor="#ffff00";
        tempdiv.style.borderWidth=2;
        tempdiv.style.borderStyle="solid";
        parent.$("body").append(tempdiv);
        dragstatuswindow(tempdiv);
		statusdiv=tempdiv
    } else {
		//update statusdiv content
        updatestatusinfo();
        stext="";
        stext+="Running Time: "+statusinfo.runtime+"<br/>";
        stext+="Gold Gain/Total: "+statusinfo.income+"/"+statusinfo.currentgold+"<br/>";
        stext+="Gold per minute: "+(60*statusinfo.goldrate).toFixed(2)+"<br/>";
        stext+="XP per minute: "+(60*statusinfo.xprate).toFixed(2)+"<br/>";
        stext+="Time till level: "+statusinfo.time2level.toFixed(0)+"<br/>";
        stext+="Kill all: "+statusinfo.lastenemy+"<br/>"
        stext+="Party: <br/>"+statusinfo.party+"<br/>"
        stext+="----------------------------<br/>";
        stext+=statusinfo.doingwhat+"<br/>";

        statusdiv.innerHTML = stext;
	}
}

function updatestatusinfo(){
    statusinfo.currentgold=character.gold;
    statusinfo.timenow=Date.now()/1000;
    statusinfo.runtime=(statusinfo.timenow-statusinfo.starttime).toFixed(1);
    statusinfo.levelruntime=(statusinfo.timenow-statusinfo.levelstarttime).toFixed(1);
    statusinfo.income=statusinfo.currentgold-statusinfo.startgold;
    statusinfo.goldrate=statusinfo.income/statusinfo.runtime;
    statusinfo.xpgain=character.xp-statusinfo.startxp;
    statusinfo.xprate=statusinfo.xpgain/statusinfo.levelruntime;
    statusinfo.lastenemy=lastenemytype;
    statusinfo.xp2level=G.levels[character.level]-character.xp;
    statusinfo.time2level=statusinfo.xp2level/statusinfo.xprate
    if (statusinfo.charlevel<character.level) {
        statusinfo.charlevel=character.level;      
        statusinfo.levelstarttime=Date.now()/1000;
        statusinfo.startxp=character.xp;
        statusinfo.doingwhat="LEVELLING UP!";
    }
    statusinfo.party="";
    for(let p_name in parent.party){
        p_hp=get_player(p_name).hp;
        p_maxhp=get_player(p_name).max_hp;
        p_mp=get_player(p_name).mp;
        p_maxmp=get_player(p_name).max_mp;
        statusinfo.party+=p_name.padEnd(10,'_')+(p_hp+"/"+p_maxhp).padEnd(10)+(p_mp+"/"+p_maxmp).padEnd(10)+"<br/>";
    }
    statusinfo.party=statusinfo.party.replace(/_/g,"&nbsp;");
}

//////////////modified from https://www.w3schools.com/howto/howto_js_draggable.asp////////////////
function dragstatuswindow(elmnt) {    
    elmnt.onmousedown = statusdragMouseDown;
}
function statusdragMouseDown(e) {
      e = e || window.event; e.preventDefault();
      pos3 = e.clientX; pos4 = e.clientY;
      statusdiv.onmousedown = statuscloseDragElement;
      statusdiv.onmousemove = statusDragging;
}
function statusDragging(e) {
      e = e || window.event;
      e.preventDefault();
      statuswindowpos1 = statuswindowpos3 - e.clientX;
      statuswindowpos2 = statuswindowpos4 - e.clientY;
      windowobj=parent.$("#genericnoobstatuswindow");
      statusmidx=windowobj.width()/2;
      statusmidy=windowobj.height()/2;
      statuswindowpos3 = e.clientX-statusmidx;
      statuswindowpos4 = e.clientY-statusmidy;
      statusdiv.style.top = (statusdiv.offsetTop - statuswindowpos2-statusmidy) + "px";
      statusdiv.style.left = (statusdiv.offsetLeft - statuswindowpos1-statusmidx) + "px";
}
function statuscloseDragElement() {
      statusdiv.onmousedown = statusdragMouseDown;
      statusdiv.onmousemove = null;
}


