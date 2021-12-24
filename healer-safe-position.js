var attack_mode=true;
var doattacks=true;


setInterval(function(){
	use_hp_or_mp_2();
	loot();
	if(!attack_mode || character.rip || is_moving(character)) return;
	runawayfrombadguysbutstaynearpartylead();
	healpartymembers();
},1000/10); // Loops every 1/10 seconds.

function healpartymembers(){
	//parent.ctarget=get_player("BeoNuka")
	healwho=null;
	healpriority=0;
	for(let p_name in parent.party){
		player=get_player(p_name);
		php=player.hp;
		pmaxhp=player.max_hp;
		checkpriority=1-(php/pmaxhp);
		if (checkpriority>healpriority){
			healwho=player;
		}
	}
	if (healwho) {
		heal(healwho)
	}
}

function use_hp_or_mp_2()
{
    if(safeties && mssince(last_potion)<min(200,character.ping*3)) return;
    //prioritize mp regen if low
    if (character.mp/character.max_mp<0.80){ 
        if (character.mp/character.max_mp>-0.3) {
            if (!is_on_cooldown('regen_mp')){use_skill('regen_mp');}
        } else {use_skill('use_mp');}
    }
    //otherwise, heal asap - same cooldown as mp.
    if (character.hp/character.max_hp<0.7){
        if (character.hp/character.max_hp>0.3) {
            if (!is_on_cooldown('regen_hp')){use_skill('regen_hp');}
        } else {use_skill('use_hp');}
    }
    //otherwise, keep mp as high as possible.
    if (!is_on_cooldown('regen_mp')){use_skill('regen_mp');}
}


function dist(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}

function getdangerxy(px,py){
	var dangerzone=150; //consider enemies in this range "dangerous"
	var danger=0;
	for(id in parent.entities)
	{
		var current=parent.entities[id];
		//if(current.type!="monster" || !current.visible || current.dead) continue;
		//if(current.type!="monster" || current.dead) continue;
		if(current.type=="monster"){
			var cdist=dist(current.x,current.y,px,py);
			if (cdist < dangerzone) {
				danger+=1/Math.pow(cdist/150,0.5);
				var e=draw_line(px,py,current.x,current.y,1,0xaa1100);
				crosshairs.push(e);
			}
		}
	}
	return danger;
}

var crosshairs=[];
function crosshair(cx,cy,color){
	var e=draw_line(cx-5,cy,cx+5,cy,1,color);
	crosshairs.push(e);
	var e=draw_line(cx,cy-5,cx,cy+5,1,color);
	crosshairs.push(e);
}
function clearcrosshairs(){
	while (crosshairs.length>0){
		e=crosshairs.pop();
		e.destroy();
	}
}

function runawayfrombadguysbutstaynearpartylead()
{
	var ppts=[];
	var healrange=character.range*0.7; //must be in this range to the leader
	var leadername=character.party;
	var leaderobj=get_player(leadername);
	var leadx=leaderobj.x;
	var leady=leaderobj.y;
	var charx=character.x;
	var chary=character.y;
	currentdistance=dist(leadx, leady, charx, chary);
	if (currentdistance>healrange) {
		dx=leadx-charx;
		dy=leady-chary;
		charx=leadx-dx*healrange/currentdistance;
		chary=leady-dy*healrange/currentdistance;
	}
	var safex=charx;
	var safey=chary;
	var saferate=99999;
	clearcrosshairs();
	for (let px = -80; px <= 80; px+=20) {
		for (let py = -80; py <= 80; py+=20) {
			newcx=charx+px;
			newcy=chary+py;			
			ldist=dist(newcx,newcy, leadx, leady);
			if (ldist<healrange) {
				pdanger=getdangerxy(newcx,newcy);
				ppts.push([newcx,newcy,pdanger])
				if (pdanger<saferate){
					saferate=pdanger;
					safex=newcx;
					safey=newcy;
				}
			}			
		}
	}
	dangermin=9999999;
	dangermax=0;	
	for(let i = 0; i < ppts.length; i++){
		danger=ppts[i][2];
		if (danger>dangermax) dangermax=danger;
		if (danger<dangermin) dangermin=danger;
	}
	for(let i = 0; i < ppts.length; i++){
		pptx=ppts[i][0];
		ppty=ppts[i][1];
		danger=ppts[i][2];
		cr=Math.floor(127+(127*(danger-dangermin)/(dangermax-dangermin)));
		cg=Math.floor(127+(127*(dangermax-danger)/(dangermax-dangermin)));
		crosshair(pptx,ppty,(cr*256+cg)*256);
	}
	move(safex,safey);
}

var autoacceptinvitelist=["Beomagi"];
var autoacceptinvitelisttimer={}

function autoacceptpartyinvite(){
    var timenow=Date.now()/1000;
    autoacceptinvitelist.forEach(function(charname){
        if (!(charname in parent.party)) {
            if (!(charname in autoacceptinvitelisttimer)) {
                accept_party_invite(charname);
                autoacceptinvitelisttimer[charname]=timenow;
            } else {
                if (timenow-autoacceptinvitelisttimer[charname] > 10){
                    delete(autoacceptinvitelisttimer[charname]);
                }
            }
        }
    });
}