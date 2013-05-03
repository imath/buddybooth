/**
* Merci à Alexandre Alapetite pour son showcase de getUserMedia()
* qui a inspiré BuddyBooth
* http://alexandre.alapetite.fr/doc-alex/html5-webcam/
*/

info = escape( buddybooth_vars.info );

/* html5 getusermedia()*/
var htmlfive = '<div class="buddybooth">';
htmlfive += '<div id="video_container">';
htmlfive += '<div id="buddybooth_message"></div>';
htmlfive += '<video id="video" autoplay="autoplay"></video>';
htmlfive += '<div id="left"></div>';
htmlfive += '<div id="right"></div>';
htmlfive += '<p class="buddybooth_action"><a href="#" id="buddyboothSnap">'+buddybooth_vars.snapbtn+'</a></p>';
htmlfive += '</div>';
htmlfive += '<div id="canvas_container">';
htmlfive += '<canvas id="canvas"></canvas>';
htmlfive += '<div id="modop">'+buddybooth_vars.info+'</div>';
htmlfive += '<p class="buddybooth_action"><a href="#" id="buddyboothRec">'+buddybooth_vars.savebtn+'</a></p>';
htmlfive += '</div>';
htmlfive += '</div>';
htmlfive += '<p style="clear:both"></p>';


/* swf fallback */
var swfHtml = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0" width="342" height="220" id="buddybooth" align="middle">';
swfHtml += '<param name="FlashVars" value="info='+ info +'&ajaxurl='+ ajaxurl +'&userid='+ buddybooth_vars.displayeduser_id+'">';
swfHtml += '<param name="allowScriptAccess" value="sameDomain" />';
swfHtml += '<param name="allowFullScreen" value="false" />';
swfHtml += '<param name="movie" value="'+ buddybooth_vars.swfurl +'" /><param name="quality" value="high" /><param name="bgcolor" value="#FFFFFF" />	<embed src="'+ buddybooth_vars.swfurl +'" quality="high" bgcolor="#FFFFFF" width="342" height="220" name="buddybooth" align="middle" wmode="window" allowScriptAccess="sameDomain" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.adobe.com/go/getflashplayer_fr" FlashVars="info='+ info +'&ajaxurl='+ ajaxurl +'&userid='+ buddybooth_vars.displayeduser_id+'" />';
swfHtml += '</object>';

function buddyBoothResult( avatar ) {
	if( avatar != 'dang') {
		jQuery('.user-'+buddybooth_vars.displayeduser_id+'-avatar').each(function(){
			jQuery(this).attr( 'src', avatar );
		});
		jQuery('html, body').animate({ scrollTop: jQuery("#item-header-avatar").offset().top }, 500);
		if( !jQuery('#message').length )
			jQuery('#item-header').append('<div id="message" class="updated"><p>'+ buddybooth_vars.messagesuccess +'</p>');
	} else {
		alert( buddybooth_vars.errormessage );
	}
}

jQuery(document).ready(function($){
	$('#avatar-upload').append( '<div id="buddybooth_container"><p>' + buddybooth_vars.alternative + '</p>'+htmlfive+'</div>');
	var video = $('#video').get(0);
	var canvas = $('#canvas').get(0);
	var videoStream = null;
	var snapenable = false;
	var recenable = false;
	var img;

	function log(text)
	{
		$('#buddybooth_message').html(text);
	}

	$('#buddyboothSnap').click( function(){
		if( !snapenable ) {
			alert( buddybooth_vars.messagewait );
			return false;
		} else {
			$('#modop').hide();
			canvas.width = video.videoWidth * 0.234375;
			canvas.height = video.videoHeight * 0.3125;
			canvas.getContext('2d').drawImage(video, 80, 0, 480, 480, 0, 0, 150, 150);
			img = canvas.toDataURL("image/png");
			recenable = true;
			return false;
		}
	}); 
	
	$('#buddyboothRec').click( function(){
		if( !recenable ) {
			alert(buddybooth_vars.messagealert );
			return false;
		} else {
			buddyboothUpload( img );
			return false;
		}
	});
	
	function buddyboothUpload( img ) {
		
		$.post( ajaxurl, {
			action: 'buddybooth_save_avatar',
			'encodedimg': img,
			'user_id':buddybooth_vars.displayeduser_id
		},
		function(response) {
			
			if( response != 'imageUrl=dang' ) {
				avatar = response.replace('imageUrl=','');
				buddyBoothResult( avatar );
			}
			else alert( buddybooth_vars.errormessage );
		});
				
	}
	
	function noStream()
	{
		log( buddybooth_vars.noaccess );
	}

	function stop()
	{
		recenable = false;
		snapenable = true;
		if (videoStream)
		{
			if (videoStream.stop) videoStream.stop();
			else if (videoStream.msStop) videoStream.msStop();
			videoStream.onended = null;
			videoStream = null;
		}
		if (video)
		{
			video.onerror = null;
			video.pause();
			if (video.mozSrcObject)
				video.mozSrcObject = null;
			video.src = "";
		}
	}

	function gotStream(stream)
	{
		videoStream = stream;
		log( buddybooth_vars.messagevideo );
		video.onerror = function ()
		{
			log('video.onerror');
			if (video) stop();
		};
		stream.onended = noStream;
		if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
		else if (video.mozSrcObject !== undefined)
		{//FF18a
			video.mozSrcObject = stream;
			video.play();
		}
		else if (navigator.mozGetUserMedia)
		{//FF16a, 17a
			video.src = stream;
			video.play();
		}
		else if (window.URL) video.src = window.URL.createObjectURL(stream);
		else video.src = stream;
		$('#buddybooth_message').hide();
		snapenable = true;
	}
	
	if ((typeof window === 'undefined') || (typeof navigator === 'undefined')) log( buddybooth_vars.messagewin );
	else if (!(video && canvas)) log( buddybooth_vars.messagectxt );
	else
	{
		log( buddybooth_vars.messageask );
		if (navigator.getUserMedia) navigator.getUserMedia({video:true}, gotStream, noStream);
		else if (navigator.oGetUserMedia) navigator.oGetUserMedia({video:true}, gotStream, noStream);
		else if (navigator.mozGetUserMedia) navigator.mozGetUserMedia({video:true}, gotStream, noStream);
		else if (navigator.webkitGetUserMedia) navigator.webkitGetUserMedia({video:true}, gotStream, noStream);
		else if (navigator.msGetUserMedia) navigator.msGetUserMedia({video:true, audio:false}, gotStream, noStream);
		else {
			log( buddybooth_vars.messagenohtmlfive );
			$('#buddybooth_container').html( '<div style="text-align:center;padding-top:20px"><p>' + buddybooth_vars.alternative + '</p>'+ swfHtml +'</div>' );
		}
	}
});