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
statusinfo.mode="Manual";
statusinfo.compoundium=null;
statusinfo.compoundium_str="";
statusinfo.currentlycompounding="";
modecolor_ai="#ff0000";
modecolor_player="#00ff00";
modecolor=modecolor_ai;


parent.$("body").find("#genericnoobstatuswindow").remove();

setInterval(function(){
	use_hp_or_mp_2();
	loot();
    autopartyinvite();
    compoundium();
    updatewindow();

	if(!attack_mode || character.rip || is_moving(character)) return;

	var target=get_targeted_monster();
	
	if(!target)
	{
		target=get_nearest_monster({min_xp:100,max_att:120,type:lastenemytype});
		if(target) change_target(target);
		else
		{ set_message("No Monsters"); return; }
	} else {
        lastenemytype=get_entity(character.target).mtype;
    }
	
    if (statusinfo.mode=="AI") {
	    fightercheckmove(target);
    }
	
},1000/10); // Loops every 1/4 seconds.

function compoundium(){ //generate list of compoundable stuff
    var accessories=["ringsj","hpbelt","hpamulet"];
    var compoundpending={};
    var inv_max=42;
    for (var indx=0; indx<inv_max; indx++){
        cur_item=character.items[indx];
        if (cur_item){
            if (accessories.indexOf(cur_item.name)>-1) {            
                if (!(cur_item.name in compoundpending)) {
                    compoundpending[cur_item.name]={};
                }
                if (!(cur_item.level in compoundpending[cur_item.name])) {
                    compoundpending[cur_item.name][cur_item.level]=[];
                }
                compoundpending[cur_item.name][cur_item.level].push(indx);
            }
        }
    }
    statusinfo.compoundium=compoundpending;
    statusinfo.compoundium_str="";
    for (let kname of Object.keys(statusinfo.compoundium)){
        for (let klevel of Object.keys(statusinfo.compoundium[kname])){
            if (statusinfo.compoundium[kname][klevel].length>=3){
                var compoundinfoline=kname+"-L"+klevel+" : "+statusinfo.compoundium[kname][klevel].length;
                statusinfo.compoundium_str+=compoundinfoline+"<br/>" 
            }           
        }
    }
}

var currentlycompounding=false;
function compoundlevel(itemlevel){
    if (!currentlycompounding) {
        for (let kname of Object.keys(statusinfo.compoundium)){
            for (let klevel of Object.keys(statusinfo.compoundium[kname])){
                if (klevel==itemlevel) {
                    if (statusinfo.compoundium[kname][klevel].length>=3){
                        statusinfo.currentlycompounding=kname+"-L"+klevel;
                        idx1=statusinfo.compoundium[kname][klevel][0];
                        idx2=statusinfo.compoundium[kname][klevel][1];
                        idx3=statusinfo.compoundium[kname][klevel][2];
                        currentlycompounding=true;                        
                        compound(idx1,idx2,idx3,locate_item("cscroll0")).then(
                            function(){
                                currentlycompounding=false;
                                statusinfo.currentlycompounding="";
                                compoundlevel(itemlevel);
                                return;
                            }
                        );
                    }
                }
            }
        }
    }
}

function fightercheckmove(target){
    var dx=target.x-character.x;
    var dy=target.y-character.y;
    var followx=target.x;
    var followy=target.y;

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
                    if (get_entity(character.target)) {
					    var mytargettarget=get_entity(character.target).target
                    } else {
                        var mytargettarget=null;
                    }
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


var autoinvitelist=["BeoNuka","BeoHP","PewPewMagoo"];
var autoinvitelisttimer={};

function autopartyinvite(){
    var timenow=Date.now()/1000;
    autoinvitelist.forEach(function(charname){
        if (!(charname in parent.party)) {
            if (!(charname in autoinvitelisttimer)) {
                send_party_invite(charname);
                autoinvitelisttimer[charname]=timenow;
            } else {
                if (timenow-autoinvitelisttimer[charname] > 10){
                    delete(autoinvitelisttimer[charname]);
                }
            }
        }
    });
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
        tempdiv.style.fontFamily="monospace";
        tempdiv.style.fontSize="1.1em";
        tempdiv.style.fontWeight=900;
        tempdiv.style.zIndex=2147483646;
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
        stext+="Mode: "+"<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.togglemode()' style='display:inline-block;background-color:"+modecolor+"'>"+statusinfo.mode+"</div><br/>";
        stext+="Running Time: "+statusinfo.runtime+"<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.resetstats()' style='display:inline-block;background-color:#f00'>[reset]</div><br/>";
        stext+="Gold Gain/Total: "+statusinfo.income+"/"+statusinfo.currentgold+"<br/>";
        stext+="Gold per minute: "+(60*statusinfo.goldrate).toFixed(2)+"<br/>";
        stext+="XP per minute: "+(60*statusinfo.xprate).toFixed(2)+"<br/>";
        stext+="Time till level: "+statusinfo.time2level.toFixed(0)+"<br/>";
        stext+="Kill all: "+statusinfo.lastenemy+"<br/>";
        stext+="Party: <br/>"+statusinfo.party;
        stext+="----------------------------<br/>";
        stext+=statusinfo.doingwhat+"<br/>";
        if (statusinfo.compoundium_str!==""){
            stext+="Compound: ";
            stext+="<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.compoundlevel(0)' style='display:inline-block;background-color:#8000a0'>L0</div>&nbsp;";
            stext+="<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.compoundlevel(1)' style='display:inline-block;background-color:#807000'>L1</div>&nbsp;";
            stext+="<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.compoundlevel(2)' style='display:inline-block;background-color:#8000a0'>L2</div>&nbsp;";
            stext+="<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.compoundlevel(3)' style='display:inline-block;background-color:#807000'>L3</div>&nbsp;";
            stext+="<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.compoundlevel(4)' style='display:inline-block;background-color:#8000a0'>L4</div>&nbsp;<br/>";
            stext+=statusinfo.compoundium_str+"<br/>";
        }
        if (statusinfo.currentlycompounding!==""){
            stext+="Currently Compounding: "+statusinfo.currentlycompounding+"<br/>";
        }
        statusdiv.innerHTML = stext;
	}
}

function togglemode(){
    if (statusinfo.mode == "AI") {
        statusinfo.mode = "Manual"
        modecolor=modecolor_player;
    } else {
        statusinfo.mode = "AI";
        modecolor=modecolor_ai;
    }
}

function resetstats(){
    statusinfo.startgold=character.gold;
    statusinfo.starttime=Date.now()/1000;
    statusinfo.levelstarttime=Date.now()/1000;
    statusinfo.startxp=character.xp;
    statusinfo.doingwhat="starting";
    statusinfo.goldtracking=[];
    statusinfo.lastenemy=lastenemytype;
    statusinfo.charlevel=character.level;
    statuscloseDragElement();
    statusdiv.onmousemove = null;
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
        statusinfo.party+=p_name.padEnd(12,'_')+(p_hp+"/"+p_maxhp).padEnd(10)+(p_mp+"/"+p_maxmp).padEnd(10)+"<br/>";
    }
    statusinfo.party=statusinfo.party.replace(/_/g,"&nbsp;");
}

//////////////modified from https://www.w3schools.com/howto/howto_js_draggable.asp////////////////
function dragstatuswindow(elmnt) {    
    elmnt.ondblclick = statusdragMouseDown;
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
      statusdiv.ondblclick = statusdragMouseDown;
      statusdiv.onmousemove = null;
      statusdiv.onmousedown = null;
}


