<?php

header("Cache-Control: public");
header("Content-Description: File Transfer");
header("Content-type: application/octet-stream");
header('Content-Disposition: attachment; filename=output.svg');
echo $_POST['content'];
?>