<?php

/**
 * Copyright (c) 2011, Andrew Freiday
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 * 
 * https://github.com/afreiday/php-waveform-png
 */
require_once('../config.inc');
require_once('../include/db.php');

ini_set("max_execution_time", "30000");

// how much detail we want. Larger number means less detail
// (basically, how many bytes/frames to skip processing)
// the lower the number means longer processing time
define("DETAIL", 10);

define("DEFAULT_WIDTH", 800);
define("DEFAULT_HEIGHT", 160);
define("DEFAULT_FOREGROUND", "#FFFF00");
define("DEFAULT_BACKGROUND", "#000000");

/**
 * GENERAL FUNCTIONS
 */
function findValues($byte1, $byte2) {
    $byte1 = hexdec(bin2hex($byte1));
    $byte2 = hexdec(bin2hex($byte2));
    return ($byte1 + ($byte2 * 256));
}

/**
 * Great function slightly modified as posted by Minux at
 * http://forums.clantemplates.com/showthread.php?t=133805
 */
function html2rgb($input) {
    $input = ($input[0] == "#") ? substr($input, 1, 6) : substr($input, 0, 6);
    return array(
        hexdec(substr($input, 0, 2)),
        hexdec(substr($input, 2, 2)),
        hexdec(substr($input, 4, 2))
    );
}

function generateWaveForm($id, $type, $stereo = false) {
        // get user vars from form
        $width = isset($_POST["width"]) ? (int) $_POST["width"] : DEFAULT_WIDTH;
        $height = isset($_POST["height"]) ? (int) $_POST["height"] : DEFAULT_HEIGHT;
        $foreground = isset($_POST["foreground"]) ? $_POST["foreground"] : DEFAULT_FOREGROUND;
        $background = isset($_POST["background"]) ? $_POST["background"] : DEFAULT_BACKGROUND;
        $draw_flat = isset($_POST["flat"]) && $_POST["flat"] == "on" ? true : false;
        
    if (file_exists('../images/waveforms/' . $id . '.png')) {
        $img = imagecreatefrompng('../images/waveforms/' . $id . '.png');
    } else {
        $tmpname = substr(md5(time()), 0, 10);
        /**
         * convert mp3 to wav using lame decoder
         * First, resample the original mp3 using as mono (-m m), 16 bit (-b 16), and 8 KHz (--resample 8)
         * Secondly, convert that resampled mp3 into a wav
         * We don't necessarily need high quality audio to produce a waveform, doing this process reduces the WAV
         * to it's simplest form and makes processing significantly faster
         */
        if ($stereo) {
            // scale right channel down (a scale of 0 does not work)
            exec("lame {$tmpname}_o.mp3 --scale-r 0.1 -m m -S -f -b 16 --resample 8 {$tmpname}.mp3 && lame -S --decode {$tmpname}.mp3 {$tmpname}_l.wav");
            // same as above, left channel
            exec("lame {$tmpname}_o.mp3 --scale-l 0.1 -m m -S -f -b 16 --resample 8 {$tmpname}.mp3 && lame -S --decode {$tmpname}.mp3 {$tmpname}_r.wav");
            $wavs_to_process[] = "{$tmpname}_l.wav";
            $wavs_to_process[] = "{$tmpname}_r.wav";
        } else {
            //exec("lame {$tmpname}_o.mp3 -m m -S -f -b 16 --resample 8 {$tmpname}.mp3 && lame -S --decode {$tmpname}.mp3 {$tmpname}.wav");
            exec(SOX_CMD." -t " . $type . " uploads/$id -b 16 -c 1 /tmp/{$tmpname}.wav");
            $wavs_to_process[] = "/tmp/{$tmpname}.wav";
        }

        // get user vars from form
        $width = isset($_POST["width"]) ? (int) $_POST["width"] : DEFAULT_WIDTH;
        $height = isset($_POST["height"]) ? (int) $_POST["height"] : DEFAULT_HEIGHT;
        $foreground = isset($_POST["foreground"]) ? $_POST["foreground"] : DEFAULT_FOREGROUND;
        $background = isset($_POST["background"]) ? $_POST["background"] : DEFAULT_BACKGROUND;
        $draw_flat = isset($_POST["flat"]) && $_POST["flat"] == "on" ? true : false;

        $img = false;

        // generate foreground color
        list($r, $g, $b) = html2rgb($foreground);

        // process each wav individually
        for ($wav = 1; $wav <= sizeof($wavs_to_process); $wav++) {

            $filename = $wavs_to_process[$wav - 1];

            /**
             * Below as posted by "zvoneM" on
             * http://forums.devshed.com/php-development-5/reading-16-bit-wav-file-318740.html
             * as findValues() defined above
             * Translated from Croation to English - July 11, 2011
             */
            $handle = fopen($filename, "r");
            // wav file header retrieval
            $heading[] = fread($handle, 4);
            $heading[] = bin2hex(fread($handle, 4));
            $heading[] = fread($handle, 4);
            $heading[] = fread($handle, 4);
            $heading[] = bin2hex(fread($handle, 4));
            $heading[] = bin2hex(fread($handle, 2));
            $heading[] = bin2hex(fread($handle, 2));
            $heading[] = bin2hex(fread($handle, 4));
            $heading[] = bin2hex(fread($handle, 4));
            $heading[] = bin2hex(fread($handle, 2));
            $heading[] = bin2hex(fread($handle, 2));
            $heading[] = fread($handle, 4);
            $heading[] = bin2hex(fread($handle, 4));

            // wav bitrate 
            $peek = hexdec(substr($heading[10], 0, 2));
            $byte = $peek / 8;

            // checking whether a mono or stereo wav
            $channel = hexdec(substr($heading[6], 0, 2));

            $ratio = ($channel == 2 ? 40 : 80);

            // start putting together the initial canvas
            // $data_size = (size_of_file - header_bytes_read) / skipped_bytes + 1
            $data_size = floor((filesize($filename) - 44) / ($ratio + $byte) + 1);
            $data_point = 0;

            // now that we have the data_size for a single channel (they both will be the same)
            // we can initialize our image canvas
            if (!$img) {
                // create original image width based on amount of detail
                // each waveform to be processed with be $height high, but will be condensed
                // and resized later (if specified)
                $img = imagecreatetruecolor($data_size / DETAIL, $height * sizeof($wavs_to_process));

                // fill background of image
                if ($background == "") {
                    // transparent background specified
                    imagesavealpha($img, true);
                    $transparentColor = imagecolorallocatealpha($img, 0, 0, 0, 127);
                    imagefill($img, 0, 0, $transparentColor);
                } else {
                    list($br, $bg, $bb) = html2rgb($background);
                    imagefilledrectangle($img, 0, 0, (int) ($data_size / DETAIL), $height * sizeof($wavs_to_process), imagecolorallocate($img, $br, $bg, $bb));
                }
            }

            while (!feof($handle) && $data_point < $data_size) {
                if ($data_point++ % DETAIL == 0) {
                    $bytes = array();

                    // get number of bytes depending on bitrate
                    for ($i = 0; $i < $byte; $i++)
                        $bytes[$i] = fgetc($handle);

                    switch ($byte) {
                        // get value for 8-bit wav
                        case 1:
                            $data = findValues($bytes[0], $bytes[1]);
                            break;
                        // get value for 16-bit wav
                        case 2:
                            if (ord($bytes[1]) & 128)
                                $temp = 0;
                            else
                                $temp = 128;
                            $temp = chr((ord($bytes[1]) & 127) + $temp);
                            $data = floor(findValues($bytes[0], $temp) / 256);
                            break;
                    }

                    // skip bytes for memory optimization
                    fseek($handle, $ratio, SEEK_CUR);

                    // draw this data point
                    // relative value based on height of image being generated
                    // data values can range between 0 and 255
                    $v = (int) ($data / 255 * $height);

                    // don't print flat values on the canvas if not necessary
                    if (!($v / $height == 0.5 && !$draw_flat))
                    // draw the line on the image using the $v value and centering it vertically on the canvas
                        imageline(
                                $img,
                                // x1
                                (int) ($data_point / DETAIL),
                                // y1: height of the image minus $v as a percentage of the height for the wave amplitude
                                $height * $wav - $v,
                                // x2
                                (int) ($data_point / DETAIL),
                                // y2: same as y1, but from the bottom of the image
                                $height * $wav - ($height - $v), imagecolorallocate($img, $r, $g, $b)
                        );
                } else {
                    // skip this one due to lack of detail
                    fseek($handle, $ratio + $byte, SEEK_CUR);
                }
            }

            // close and cleanup
            fclose($handle);

            // delete the processed wav file
            unlink($filename);
        }
    }
    header("Content-Type: image/png");

    if (!file_exists('../images/waveforms/' . $id . '.png'))
            imagepng($img, '../images/waveforms/' . $id . '.png');
    
    // want it resized?
    if ($width) {
        // resample the image to the proportions defined in the form
        $rimg = imagecreatetruecolor($width, $height);
        // save alpha from original image
        imagesavealpha($rimg, true);
        imagealphablending($rimg, false);
        // copy to resized
        imagecopyresampled($rimg, $img, 0, 0, 0, 0, $width, $height, imagesx($img), imagesy($img));
        imagepng($rimg);
        imagedestroy($rimg);
    } else {
        imagepng($img);
    }

    imagedestroy($img);
}

if (isset($_GET['id']) && preg_match('/([0-9a-zA-Z]+)$/', $_GET['id'], $id)) {
    $s = new Storage('yaydev', 'audio');

    $file = $s->select($id[1]);

    //var_dump($file);

    generateWaveForm($id[1], $file['type']);
}
?>
