/**
 * Copyright (c) 2012, "Koen Martens" <gmc@sonologic.nl>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of Sonologic nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL SONOLOGIC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *  
 */

function loading() {
    $("#loading").show();
}

function loadingDone() {
    $("#loading").hide();
}

function editAudio(id) {
    console.log('edit '+id)
    
    $("#edit .audioid").text(id);
    $("#edit .waveform").attr('src','images/loading_waveform.png');
    $("#edit .waveform").attr('src','upload/waveform.php?id='+id);
    
    $("#edit").show();
    
    $("#edit .properties").empty();
    
    loading();
    $.getJSON('upload/audio.php?id='+id,function(data) {
                
        console.log(data);
        
        $("#edit input[name='title']").val('');
        $("#edit input[name='production']").val('aa');
        $("#edit .teaser").empty();
        $("#edit .shownotes").empty();
        
        $("#edit input[name='title']").val(data.title);
        $("#edit input[name='production']").val(data.artist);
        $("#edit textarea[name='teaser']").text(data.teaser);
        $("#edit textarea[name='shownotes']").text(data.shownotes);
        
        for(var key in data) {
            console.log(key);
       
            $("#edit .properties").append('<div>'+key+" => "+data[key]+"</div>");
        
        }
        loadingDone();
    });
    
}

function editShow(id) {
    $("#editshow").show();
    $.getJSON('schedule/show.php?id='+id,function(data) {
        data.collection='show';
        fillForm("#editshow form",data);
    });
}

function fillForm(selector,data) {
    console.log('fillForm('+selector+','+data+')');
    
    $(selector+" input[type='text']").each(function(index) {
        var name=$(this).attr('name'); 
        if(data[name]) {
            $(this).val(data[name]);
        } else {
            $(this).val('');
        }
    });
    
    $(selector+" input[type='hidden']").each(function(index) {
        var name=$(this).attr('name'); 
        if(data[name]) {
            $(this).val(data[name]);
        } else {
            $(this).val('');
        }
    });
    
    $(selector+" textarea").each(function(index) {
        var name=$(this).attr('name');
        if(data[name]) {
            $(this).text(data[name]);
        } else {
            $(this).text('');
        }
    });
    
    $(selector+" select").each(function(index) {
        var name=$(this).attr('name');
        console.log(name);
        $(selector+" select[name='"+name+"'] option").removeAttr('selected');
        if(data[name]) {
            console.log('select '+data[name]);
            console.log(selector+" selet[name='"+name+"'] option[value='"+data[name]+"']");
            $(selector+" select[name='"+name+"'] option[value='"+data[name]+"']").attr('selected','selected');
        }
    });
}

function updateShowList() {
    $("#showlist").dataTable().fnClearTable();
    $('#showlist').dataTable( {
        'bDestroy': true,
        "sAjaxSource": 'schedule/show.php?aa=1'
    } );    
}

$(document).ready(function() {


    $("#mainmenu span").click(function() {
        console.log($(this).data('applet'));
        if($(this).hasClass('inactive')) {
            $(".applet").fadeOut('slow');
            $("#"+$(this).data('applet')).fadeIn('slow');
            $("#mainmenu span").removeClass('active');
            $("#mainmenu span").addClass('inactive');
            $(this).removeClass('inactive');
            $(this).addClass('active');
        }
    });
                
    
    
    $('#audiolist').dataTable( {
        "bProcessing": true,
        "sAjaxSource": 'upload/audio.php?aa=1'
    } );


    $('#audiolist tbody tr').live('click', function () {
        var tds=$('td',this);
       
        editAudio($(tds[0]).text());
    });

    $('#showlist').dataTable( {
        "bProcessing": true,
        "sAjaxSource": 'schedule/show.php?aa=1'
    } );
    
    $('#showlist tbody tr').live('click', function () {
        var tds=$('td',this);
       
        editShow($(tds[0]).text());
    });


    $('#episodelist').dataTable( {
        "bProcessing": true,
        "sAjaxSource": 'schedule/episode.php?aa=1'
    } );
    
    $('#episodelist tbody tr').live('click', function () {
        var tds=$('td',this);
       
        editEpisode($(tds[0]).text());
    });



    $('#edit .cancel').click(function() {
        $("#edit").fadeOut('slow'); 
    });

    $('#edit .save').click(function() {
        $("#edit").fadeOut('slow'); 
    });
    
    $("#editshow .cancel").click(function() {
        $("#editshow").fadeOut('slow'); 
    });
    
    $("#editshow .save").click(function() {
        loading();
        $.post('upload/save.php',$("#editshow form").serialize(),function(data) {
            loadingDone();
            $("#editshow").fadeOut('slow'); 
            updateShowList();
        });       
    });

// page is now ready, initialize the calendar...
/*
                $('#calendar').fullCalendar({
                    // put your options and callbacks here
                    dayClick: function (date, allDay, jsEvent, view) {
                        console.log(date);
                        console.log(allDay);
                        console.log(jsEvent);
                        console.log(view);
                        if(!allDay) {
                            $("#yaydate").text(date.toString());
                            $("#fileevent").show();
                            $("#streamevent").hide();
                            $("#event").show();
                        }
                    }
                });
                
                $("#calendar").fullCalendar('changeView','agendaWeek');
               
                $("select[name='type']").change(function() {
                    console.log('changed '+$("select[name='type']")[0].options.selectedIndex);
                    if($("select[name='type']")[0].options.selectedIndex==1) {
                        $("#fileevent").hide();
                        $("#streamevent").show();
                    } else {
                        $("#fileevent").show();
                        $("#streamevent").hide();                        
                    }
                });
*/
});