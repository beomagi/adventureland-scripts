// Hey there!
// This is CODE, lets you control your character with code.
// If you don't know how to code, don't worry, It's easy.
// Just set attack_mode to true and ENGAGE!

var attack_mode=true;
var followleader=true;
var circlestrafe=true;
var castdelay=40;
var doattacks=true;
var waitfortaroftar=true;
var leader_to_enemy_ratio=0.9;
var move_back_and_forth=true;
var lastcasttime=new Date();
var reduce_max_range=0.55;

setInterval(function(){
	use_hp_or_mp_2();
	loot();
    autoacceptpartyinvite();
	if(!attack_mode || character.rip || is_moving(character)) return;

	if (!followleader) {
		var target=get_targeted_monster();
	} else {
		var leadername=character.party;
		var leaderobj=get_player(leadername);
		var target = get_target_of(leaderobj);
		var tarOftar = get_target_of(target);
        doattacks=true;
		if ((!tarOftar) && (waitfortaroftar)){ doattacks=false; }
	}
	if(!target)
	{
		target=get_nearest_monster({min_xp:100,max_att:120});
		if(target) change_target(target);
		else {
			set_message("No Monsters");
			return; 
		}
	}
	
	magecheckmove(target);
},1000/10); // Loops every 1/10 seconds.

function magecheckmove(target){
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

    if(!is_in_range(target))
    {
        littlex=dx*0.1;
        littley=dy*0.1;
        move(character.x+littlex,character.y+littley);
    } else {
        set_message("Atk:"+character.x.toFixed(0)+","+character.y.toFixed(0));
        /////////////////////attack section/////////////////////
        if(can_attack(target) && doattacks){
            if (!is_on_cooldown("burst")){
                timenowdate=new Date();
                timenowepoch=timenowdate.getTime()/1000;
                timethenepoch=lastcasttime.getTime()/1000;
                if ((timenowdate-lastcasttime) > castdelay) {
                    //use_skill("burst",target);
				    lastcasttime=new Date();
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

// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland

function use_hp_or_mp_2()
{
    if(safeties && mssince(last_potion)<min(200,character.ping*3)) return;

    if (character.hp/character.max_hp<0.8){
        if (character.hp/character.max_hp>0.3) {
            if (!is_on_cooldown('regen_hp')){use_skill('regen_hp');}
        } else {
            use_skill('use_hp');
        }
    }
    if (character.mp/character.max_mp<0.99){
        if (character.mp/character.max_mp>-1) {
            if (!is_on_cooldown('regen_mp')){use_skill('regen_mp');}
        } else {
            use_skill('use_hp');
        }
    }
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