var attack_mode=true;
var followleader=false;
var circlestrafe=true;
var tauntcastdelay=16;
var doattacks=true;
var leader_to_enemy_ratio=0.9;
var move_back_and_forth=true;
var lastcasttime=new Date();
var reduce_max_range=0.95;
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

setInterval(function(){
	use_hp_or_mp_2();
	loot();

	if(!attack_mode || character.rip || is_moving(character)) return;

	if (!followleader) {
		var target=get_targeted_monster();
	} else {
		var leadername=character.party;
		var leaderobj=get_player(leadername);
		var target = get_target_of(leaderobj);
		var tarOftar = get_target_of(target);
        doattacks=true;
		if (!tarOftar) { doattacks=false; }
	}
	
	if(!target)
	{
		target=get_nearest_monster({min_xp:100,max_att:120,type:lastenemytype});
		if(target) change_target(target);
		else
		{ set_message("No Monsters"); return; }
	} else {
        lastenemytype=get_entity(character.target).mtype;
    }
	
	fightercheckmove(target);
	updatewindow();
},1000/10); // Loops every 1/4 seconds.

function fightercheckmove(target){
	/////////////////////determine if following leader or target/////////////////////
    if (followleader) {
        var leaderobj=get_player(character.party)
        var midx=leader_to_enemy_ratio*leaderobj.x+(1-leader_to_enemy_ratio)*target.x;
        var midy=leader_to_enemy_ratio*leaderobj.y+(1-leader_to_enemy_ratio)*target.y;
        var dx=midx-character.x;
        var dy=midy-character.y;
        var followx=midx;
        var followy=midy;
    } else {
        var dx=target.x-character.x;
        var dy=target.y-character.y;
        var followx=target.x;
        var followy=target.y;
    }
	/////////////////////determine if following leader or target/////////////////////

    if(!is_in_range(target))
    {
        littlex=dx*0.1;
        littley=dy*0.1;
        move(character.x+littlex,character.y+littley);
        statusinfo.doingwhat="Moving to attack";
	} else {
        statusinfo.doingwhat="Attacking!";
        set_message("Atk:"+character.x.toFixed(0)+","+character.y.toFixed(0));
        /////////////////////attack section/////////////////////
        if(can_attack(target) && doattacks){
            if (!is_on_cooldown("taunt")){
                timenowdate=new Date();
                timenowepoch=timenowdate.getTime()/1000;
                timethenepoch=lastcasttime.getTime()/1000;
                if ((timenowdate-lastcasttime) > tauntcastdelay) {
					var mytargettarget=get_entity(character.target).target
					if ((mytargettarget !== character.name) && mytargettarget) {
                    	use_skill("taunt",target);
				    	lastcasttime=new Date();
					}
                }
            }            
            attack(target);
        }
        /////////////////////attack section/////////////////////
		var tnow=new Date();
        if (move_back_and_forth) {
            var movedecide=(tnow.getTime()/1000)%3;            
		    var backforth=-1;
            if (movedecide>1) backforth=1;
        } else {
            var backforth=1;
        }
        if (!circlestrafe) {backforth=0;}
		newpos=rotateabout(
            followx,
            followy,
            character.x,
            character.y,
			0.05*backforth
        );
        kitex=newpos[0];
        kitey=newpos[1];
        ndx=kitex-followx;
        ndy=kitey-followy;
        ndistance=Math.hypot(ndx,ndy);
        kitex=followx+(character.range*ndx*reduce_max_range)/ndistance;
        kitey=followy+(character.range*ndy*reduce_max_range)/ndistance;
        move(kitex,kitey);
    }


}


function use_hp_or_mp_2()
{
    if(safeties && mssince(last_potion)<min(200,character.ping*3)) return;

    //prioritize mp regen if low
    if (character.mp/character.max_mp<0.20){ 
        if (character.mp/character.max_mp>-1) {//disabled mana pot with -1
            if (!is_on_cooldown('regen_mp')){use_skill('regen_mp');}
        } else {use_skill('use_mp');}
    }
    //otherwise, heal asap - same cooldown as mp.
    if (character.hp/character.max_hp<0.95){
        if (character.hp/character.max_hp>0.3) {
            if (!is_on_cooldown('regen_hp')){use_skill('regen_hp');}
        } else {use_skill('use_hp');}
    }
    //otherwise, keep mp as high as possible.
    if (!is_on_cooldown('regen_mp')){use_skill('regen_mp');}
}

function rotateabout(targetx,targety,ogx,ogy,angle)
{
    dx=ogx-targetx;
    dy=ogy-targety;
    cosA=Math.cos(angle);
    sinA=Math.sin(angle);
    x2=(cosA*dx-sinA*dy)+targetx;
    y2=(sinA*dx+cosA*dy)+targety;
    return([x2,y2]);
}

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
        tempdiv.style.font="Consolas";
        tempdiv.style.fontSize="1.2em";
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


