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

require_once('../include/db.php');
$target_path = "uploads/";

function transcode($uuid, $type) {
    global $target_path;
}

function extractMeta($uuid, $type, &$file) {
    global $target_path;

    if ($type == 'audio/mpeg') {
        $file['id3_version'] = id3_get_version($target_path . '/' . $uuid);
        /*        if ($version & ID3_V1_0) {
          $tags=ID3_V1_0;
          }
          if ($version & ID3_V1_1) {
          $tags=ID3_
          }
          if ($version & ID3_V2) {
          echo "Contains a 2.x tag\n";
          } */
        $tag = @id3_get_tag($target_path . '/' . $uuid);
        if (is_array($tag)) {
            foreach ($tag as $key => $value) {
                if (strlen($value) > 2 && $value[0] == chr(0xff) && $value[1] == chr(0xfe))
                    $tag[$key] = iconv("UTF-16", "UTF-8", substr($value, 0, strlen($value) - 2));
            }
            foreach ($tag as $key => $value) {
                /* echo "$key -> ".bin2hex($value)."\n";
                  echo "<pre>";
                  var_dump($key);
                  var_dump($value);
                  echo "</pre>";
                  echo "$key => $value\n"; */
                switch ($key) {
                    case 'album':
                    case 'artist':
                    case 'title':
                        $file[$key] = $value;
                        break;

                    case 'copyright':
                        if ($value !== NULL) {
                            if (isset($tag['copyrightInfo']) && $tag['copyrightInfo'] !== NULL) {
                                $file['rights'] = $tag['copyright'] . ', ' . $tag['copyrightInfo'];
                            } else {
                                $file['rights'] = $tag['copyright'];
                            }
                        }
                        break;
                    case 'copyrightInfo';
                        if (!isset($tag['copyright']) || $tag['copyright'] === NULL) {
                            $file['rights'] = $value;
                        }
                        break;
                    default:
                        $file['id3_' . $key] = $value;
                        break;
                }
            }
        }
    }
    //if($ype=='audio/ogg') {
    //}
    //return array();
}

if (count($_FILES) == 0) {
    echo json_encode(array('error' => 'no files received'));
    exit(0);
}

$result = array();

$s=new Storage('yaydev','audio');

for ($i = 0; $i < count($_FILES['files']['name']); $i++) {

    $uuid = uniqid();

    if ($_FILES['files']['error'][$i]) {
        $result[] = array(
            'error' => $_FILES['files']['error'][$i],
            'msg' => 'Upload error: ' . $_FILES['files']['error'][$i],
            'name' => basename($_FILES['files']['name'][$i]),
        );
    } else if (move_uploaded_file($_FILES['files']['tmp_name'][$i], $target_path . '/' . $uuid)) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $target_path . '/' . $uuid);
        finfo_close($finfo);
        $file = array(
            'error' => 0,
            '_id' => $uuid,
            'name' => basename($_FILES['files']['name'][$i]),
            'size' => filesize($target_path . '/' . $uuid),
            'type' => $mime,
            'url' => '',
            'flac' => false,
            'waveform' => false,
        );
        extractMeta($uuid, $mime, $file);
        $result[] = $file;
        $s->store($file);
    } else {
        $result[] = array(
            'error' => '-1',
            'msg' => 'There was an error uploading the file, please try again!',
            'name' => basename($_FILES['files']['name'][$i]),
        );
    }
}

echo json_encode($result);
?>
