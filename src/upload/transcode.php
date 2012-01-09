<?php

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
require_once('../config.inc');
require_once('../include/db.php');

if(!defined('FILEINFO_MIME_TYPE'))
  define('FILEINFO_MIME_TYPE',FILEINFO_MIME);

if (!isset($_GET['p'])) {
    if (isset($_GET['id']) && preg_match('/^([a-zA-Z0-9]+)$/', $_GET['id'], $id)) {
        $fmt = 'flac';
        if (isset($_GET['f']) && preg_match('/^(mp3|flac|ogg)$/', $_GET['f'], $ufmt)) {
            $fmt = $ufmt[1];
        }
        $s = new Storage('yaydev', 'audio');

        $meta = $s->select($id[1]);

        if ($meta) {

            $cmd = SOX_CMD.' -S -t ' . $meta['type'] . ' uploads/' . $id[1] . ' uploads/' . $id[1] . '.'.$fmt.' > /dev/null 2> /tmp/' . $id[1] . ' & echo $!';
            exec($cmd, $op);

            session_start();
            $_SESSION['pid'] = (int) $op[0];
            $_SESSION['id'] = $id[1];
            $_SESSION['fpos'] = 0;
            $_SESSION['fmt'] = $fmt;
            session_write_close();

            echo json_encode($meta);
        } else {
            echo json_encode(array('error' => 'track id not found'));
        }
    } else {
        echo json_encode(array('error' => 'no id'));
    }
} else {
    $pid = -1;
    $id = NULL;
    $pos = 0;
    $fmt = 'flac';

    session_start();
    if (isset($_SESSION['pid']))
        $pid = $_SESSION['pid'];
    if (isset($_SESSION['id']))
        $id = $_SESSION['id'];
    if (isset($_SESSION['fpos']))
        $pos = $_SESSION['fpos'];
    if (isset($_SESSION['fmt']))
        $fmt = $_SESSION['fmt'];
    //session_write_close();

    if ($id === NULL) {
        echo json_encode(array('error' => 'no transcoding command running (1)'));
    } else if ($pid == -1) {
        echo json_encode(array('error' => 'no transcoding command running (2)'));
    } else {
        $rv = array();
        if (file_exists('/tmp/' . $id)) {
            $fp = fopen("/tmp/" . $id, "r");
            fseek($fp, $pos);
            $s = NULL;
            while ($ss = fgets($fp)) {
                //echo "got $ss <br/>";
                $l = preg_split("/\r/", $ss);
                //var_dump($l);
                if (count($l) > 2) {
                    $s = $l[1];
                } else {
                    $s = '';
                }
            }
            $pos = ftell($fp);
            fclose($fp);
            $_SESSION['fpos'] = $pos;
            session_write_close();

            $rv['progress'] = $s;
        }
        exec("ps $pid", $op);
        if (count($op) == 2) {
            $rv['running'] = 1;
        } else {
            $rv['running'] = 0;
            $s = new Storage('yaydev', 'audio');

            $meta = $s->select($id);

            if (!isset($meta['has_'.$fmt])) {
                $meta['has_'.$fmt] = 1;
                $s->store($meta);
            }
        }
        echo json_encode($rv);
    }
}
?>
