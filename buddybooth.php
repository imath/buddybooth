<?php
/*
Plugin Name: BuddyBooth
Plugin URI: https://github.com/imath/buddybooth/
Description: Adds a photobooth to BuddyPress user avatar uploads page
Version: 1.0-beta1
Author: imath
Author URI: http://imathi.eu/
License: GPLv2
Network: true
Text Domain: buddybooth
Domain Path: /languages/
*/

// Exit if accessed directly
if ( !defined( 'ABSPATH' ) ) exit;

if ( !class_exists( 'BuddyBooth' ) ) :

class BuddyBooth {
	public $plugin_url;
	public $plugin_dir;
	public $version;
	public $plugin_js;
	public $plugin_css;
	public $plugin_swf;
	public $domain;

	function __construct() {
		$this->setup_globals();
		$this->setup_actions();
	}
	
	function setup_globals() {
		$this->version     = '1.0-beta1';
		$this->plugin_dir  = plugin_dir_path( __FILE__ );
		$this->plugin_url  = plugin_dir_url( __FILE__ );
		$this->plugin_js   = trailingslashit( $this->plugin_url . 'js' );
		$this->plugin_css  = trailingslashit( $this->plugin_url . 'css' );
		$this->plugin_swf  = trailingslashit( $this->plugin_url . 'swf' );
		$this->domain      = 'buddybooth';
	}
	
	function setup_actions() {
		add_action( 'bp_enqueue_scripts',             array( $this, 'load_cssjs'      )    );
		add_action( 'wp_ajax_buddybooth_save_avatar', array( $this, 'save_image'      )    );
		add_action( 'bp_init',                        array( $this, 'load_textdomain' ), 6 );
	}
	
	function load_cssjs() {
		
		if( bp_is_user_change_avatar() ) {
			
			//css
			wp_enqueue_style( 'buddybooth-style', $this->plugin_css .'buddybooth.css', false, $this->version );
			
			//js
			wp_enqueue_script( 'buddybooth', $this->plugin_js .'buddybooth.js', array( 'jquery' ), $this->version, true );
			wp_localize_script('buddybooth', 'buddybooth_vars', array(
						'swfurl'            => $this->plugin_swf . 'buddybooth.swf',
						'info'              => __('Hit the camera to take a Snapshot, then click the rec button to save your avatar','buddybooth'),
						'displayeduser_id'  => bp_displayed_user_id(),
						'alternative'       => __('<h3>Or</h3>Use the BuddyBooth !', 'buddybooth'),
						'errormessage'      => __('Oops, something went wrong', 'buddybooth'),
						'snapbtn'           => __('Snap shot', 'buddybooth'),
						'savebtn'           => __('Save shot', 'buddybooth'),
						'messagesuccess'    => __('Bravo! really nice avatar!', 'buddybooth'),
						'messagewait'       => __('Please wait for the video to load', 'buddybooth'),
						'messagealert'      => __('Please take a snapshot first', 'buddybooth'),
						'noaccess'          => __('You denied camera access..', 'buddybooth'),
						'messagevideo'      => __('Video stream loaded', 'buddybooth'),
						'messagewin'        => __('BuddyBooth requires window and navigator objects', 'buddybooth'),
						'messagectxt'       => __('Html context error', 'buddybooth'),
						'messageask'        => __('Requesting video stream', 'buddybooth'),
						'messagenohtmlfive' => __('Your browser does not support getUserMedia()', 'buddybooth')
					)
				);
				
		}
	}
	
	function save_image() {
		$img = !empty( $_POST['encodedimg'] ) ? $_POST['encodedimg'] : false ;
		$user_id = !empty( $_POST['user_id'] ) ? $_POST['user_id'] : bp_displayed_user_id() ;
		$lv = !empty( $_POST['tab'] ) ? $_POST['tab'] : false ;
		
		$user_avatar_folder = bp_core_avatar_upload_path() .'/avatars/' . $user_id;

		if( !empty( $img ) ) {

			$img = str_replace('data:image/png;base64,', '', $img);
			$img = str_replace(' ', '+', $img);
			$data = base64_decode($img);

			$original_file = $user_avatar_folder .'/buddybooth-'.$user_id.'.png';

			if( !file_exists( $user_avatar_folder ) )
				mkdir( $user_avatar_folder );

			$success = file_put_contents( $original_file, $data );

		} elseif( !empty( $lv ) ) {

			$temp = explode( ",", $lv );
			settype( $temp[1], 'integer' );

			$sortie = imagecreatetruecolor( 150, 150 );

			$k = 0;
			for( $i = 0; $i < 150; $i++ ){
				for( $j = 0; $j < 150; $j++){
			   		imagesetpixel( $sortie, $j, $i, $temp[$k] );
			   		$k++;
				}
			}

			if( !file_exists( $user_avatar_folder ) )
				mkdir( $user_avatar_folder );

			$original_file = $user_avatar_folder .'/buddybooth-'.$user_id.'.jpg';
			$success = imagejpeg( $sortie, $original_file, 100 );
			imagedestroy( $sortie );

		}

		if( $success ) {

			$avatar_to_crop = str_replace( bp_core_avatar_upload_path(), '', $original_file );

			bp_core_delete_existing_avatar( array( 'item_id' => $user_id, 'avatar_path' => bp_core_avatar_upload_path() .'/avatars/' . $user_id ) );

			$crop_args = array( 'item_id' => $user_id, 'original_file' => $avatar_to_crop, 'crop_x' => 0, 'crop_y' => 0);

			if( bp_core_avatar_handle_crop( $crop_args ) ) {
				$avatar_url = bp_core_fetch_avatar( array( 'type' => 'full', 'html' => false, 'item_id' => $user_id ) ); 

				// this hook allow cubepoints to add points
				do_action( 'xprofile_avatar_uploaded' );

				echo 'imageUrl='. $avatar_url;
			} else {
				echo 'imageUrl=dang';
			}

		} else {
			echo 'imageUrl=dang';
		}

		die();
	}
	
	function load_textdomain() {
		// try to get locale
		$locale = apply_filters( 'buddybooth_load_textdomain_get_locale', get_locale() );

		// if we found a locale, try to load .mo file
		if ( !empty( $locale ) ) {
			// default .mo file path
			$mofile_default = sprintf( '%s/languages/%s-%s.mo', $this->plugin_dir, $this->domain, $locale );
			// final filtered file path
			$mofile = apply_filters( 'buddybooth_textdomain_mofile', $mofile_default );
			// make sure file exists, and load it
			if ( file_exists( $mofile ) ) {
				load_textdomain( $this->domain, $mofile );
			}
		}
	}
}

function buddybooth() {
	return new BuddyBooth();
}

add_action( 'bp_include', 'buddybooth' );

endif;