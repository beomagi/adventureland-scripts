var attack_mode=true


setInterval(function(){

    use_hp_or_mp_2();
    loot();
    if(!attack_mode || character.rip || is_moving(character)) return;

    var target=get_targeted_monster();
    if(!target)
    {
        target=get_nearest_monster({min_xp:100,max_att:120});
        if(target) change_target(target);
        else
        {
            set_message("No Monsters");
            return;
        }
    }
    
    checkmove();
    if (!is_on_cooldown('regen_mp')){use_skill('regen_mp');}
    if (!is_on_cooldown('regen_hp')){use_skill('regen_hp');}

},1000/10); // Loops every 1/10 seconds.


function checkmove(){
    var target=get_targeted_monster();
    dx=target.x-character.x;
    dy=target.y-character.y;
    tdistance=Math.hypot(dx,dy);
    unitx=dx/tdistance;
    unity=dy/tdistance;

    if(!is_in_range(target))
    {
        littlex=dx*0.1;
        littley=dy*0.1;
        move(character.x+littlex,character.y+littley);
    } else {
        set_message("Atk:"+character.x.toFixed(0)+","+character.y.toFixed(0));
        if(can_attack(target)){
            
            if (!is_on_cooldown("supershot")){
                use_skill("supershot",target);
            }
            attack(target);
        }
        maxx=unitx*character.range;
        maxy=unity*character.range;
        newpos=rotateabout(target.x,target.y,character.x,character.y,0.35);
        kitex=newpos[0];
        kitey=newpos[1];
        ndx=kitex-target.x;
        ndy=kitey-target.y;
        ndistance=Math.hypot(ndx,ndy);
        kitex=target.x+(character.range*ndx)/ndistance;
        kitey=target.y+(character.range*ndy)/ndistance;
        move(kitex,kitey);
    }

}


function use_hp_or_mp_2()
{
    if(safeties && mssince(last_potion)<min(200,character.ping*3)) return;
    var used=true;
    if(is_on_cooldown("use_hp")) return;
    if(character.mp < 20) use_skill('use_mp'); 
    if(character.hp/character.max_hp<0.2) use_skill('use_hp');
    else used=false;
    if(used) last_potion=new Date();
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

