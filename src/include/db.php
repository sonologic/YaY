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
class Storage {

    public function __construct($db, $collection) {
        $this->m = new Mongo();
        $this->db = $this->m->$db;
        $this->collection = $this->db->$collection;
    }

    public function find() {
        $cursor = $this->collection->find();
        $rv = array();
        foreach ($cursor as $obj) {
            $rv[] = $obj;
        }
        return $rv;
    }

    public function select($id) {
        return $this->collection->findOne(array(
                    '_id' => $id
                ));
    }

    public function store($obj) {
        if (is_array($obj)) {
            $newobj = new StdClass();
            foreach ($obj as $key => $value) {
                $newobj->$key = $value;
            }
            $obj = $newobj;
        }
        $id = sprintf("%s", $obj->_id);
        unset($obj->_id);
        $rv = $this->collection->update(array('_id' => $id), array('$set' => $obj), array('safe' => true, "upsert" => true));
    }

}

?>