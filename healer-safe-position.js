var attack_mode=true;
var doattacks=true;


setInterval(function(){
	use_hp_or_mp_2();
	autoacceptpartyinvite();
	loot();
	if(!attack_mode || character.rip || is_moving(character)) return;
	runawayfrombadguysbutstaynearpartylead();
	healpartymembers();
	occasionallyattack();
},1000/10); // Loops every 1/10 seconds.

function occasionallyattack(){
	var leadername=character.party;
	var leaderobj=get_player(leadername);
	var target = get_target_of(leaderobj);
	var tarOftar = get_target_of(target);
	var doattacks=true;
	if (!tarOftar) doattacks=false;
	if (doattacks) {
		if(is_in_range(target) && (target))
		{
			if(can_attack(target)){
				attack(target);
			}		
		}
	}
}

function healpartymembers(){
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
        if (character.mp/character.max_mp>0.3) {
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
		if(current.type=="monster"){
			var cdist=dist(current.x,current.y,px,py);
			if (cdist < dangerzone) {
				danger+=1/Math.pow(cdist/150,0.5);
			}
		}
	}
	return danger;
}


function runawayfrombadguysbutstaynearpartylead()
{
	var ppts=[];
	var healrange=character.range*0.33; //must be in this range to the leader
	var maxwalk=character.range*0.66; //must be in this range to the leader
	var leadername=character.party;
	var leaderobj=get_player(leadername);
	var leadx=leaderobj.x;
	var leady=leaderobj.y;
	var safex=leadx;
	var safey=leady;
	var saferate=99999;
	for (let px = -120; px <= 120; px+=20) {
		for (let py = -120; py <= 120; py+=20) {
			newcx=safex+px;
			newcy=safey+py;
			if (can_move_to(newcx,newcy)) {
				ldist=dist(newcx,newcy, leadx, leady);//leader dist
				wdist=dist(newcx,newcy, character.x, character.y);//walk dist
				if ((ldist<healrange) && (wdist<maxwalk)){ //withing walk range, and range from lead
					pdanger=getdangerxy(newcx,newcy);				
					if (pdanger<saferate){
						saferate=pdanger;
						safex=newcx;
						safey=newcy;
					}
				}			
			}
		}
	}
	xmove(safex,safey);
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