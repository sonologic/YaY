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

/**
 * Parameters:
 * 
 * c - collection (audio,episode,show,schedule,showevent,...)
 * f - list of fields, comma seperated (only used when aa is defined)
 * aa - if defined, wrap results in 'aa' for jquery.dataTables 
 * id - if aa undefined, retrieve object with given id
 * 
 * If aa is set, or both aa and id are undefined, all objects in the given
 * collection will be returned.
 * 
 * @todo limit results
 */
if (isset($_GET['c']) && preg_match('/^([a-z]+)$/', $_GET['c'], $collection)) {

    $s = new Storage('yaydev', $collection[1]);
    
    $cond=array();
    if(isset($_GET['s']) && preg_match_all('/([a-zA-Z0-9_]+):([a-zA-Z0-9]+)/',$_GET['s'],$matches)) {
        for($i=0;$i<count($matches[1]);$i++) {
            $cond[$matches[1][$i]]=$matches[2][$i];
        }
    }
    
    if(isset($_GET['f']) && preg_match('/^(([_a-zA-Z]+,?)+)$/',$_GET['f'],$match)) {
        $fields=preg_split('/,/',$match[1]);
    } else {
        $fields='*';
    }

    if (isset($_GET['aa'])) {
        $items = $s->find($cond);
        $records = array();
        foreach ($items as $item) {
            $values=array();
            foreach($fields as $field) {
                if(isset($item[$field]))
                    array_push($values,$item[$field]);
                else
                    array_push($values,'');
            }
            
            $records[] = $values;
        }
        echo json_encode(array('aaData' => $records));
    } else if (isset($_GET['id']) && preg_match('/^([0-9a-zA-Z]+)$/', $_GET['id'], $id)) {
        $item = $s->select($id[1]);
        echo json_encode($item);
    } else {
        $items = $s->find($cond);
        echo json_encode($items);
    }
} else {
    echo json_encode(array('error' => 'no collection given'));
}
?>