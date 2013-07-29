<?php
require 'Slim/Slim.php';
require_once("config.php");

\Slim\Slim::registerAutoloader();
$app = new \Slim\Slim();

function getDB()
{
	global $con_string, $db;

	// connect
	$m = new Mongo($con_string); 
	$db = $m -> selectDB($db);

	return $db;
}

$app->get('/getCategory', function() {    
   
    $db = getDB();
    $cursor = $db->config->find();
    $fields = array();
    $category = array();
    
    foreach ($cursor as $categories) {
       foreach($categories as $key => $value) {           
           if($key !== "_id") {
               array_push($category, array("id" => $key));
               
               foreach($value as $field) {
                   array_push($fields, array('id' => $key, 'key' => $field['key'], 'desc' => $field['desc']));
               }
           }
       }
    }
    
    echo json_encode(array("config" => $category, "fields" => $fields));
});

$app->post('/saveCategory', function() use ($app){
    
    $db = getDB();
    $input = $app->request->params('fields');
    $removed = $app->request->params('removed');
    $fields = array();
    
    if(isset($removed)) {
        foreach($removed as $item) {
            $db->config->remove(array($item => array('$exists' => true)));
        }
    }
    
    foreach($input as $field) {
        
        if(!array_key_exists($field["id"], $fields))
            $fields[$field["id"]] = array();
        
        array_push($fields[$field["id"]], array("key" => $field["key"], "desc" => $field["desc"]));
    }
    
    foreach($fields as $key => $value) {
        $db->config->update(array($key => array('$exists' => true)), array($key => $value), array('upsert' => true));
    }
});

$app->run();
?>