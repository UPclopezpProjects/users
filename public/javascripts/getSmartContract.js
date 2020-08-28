function findSmartContractDetail(){
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        document.getElementById("divSmartContract").innerHTML = xhttp.responseText;
    }
  };
  var sessionID = document.getElementById("divSmartContract");
  //alert(sessionID.getAttribute("sesid"));
  xhttp.open("POST", "/getSmartContract", true);
  var parametro = "sessionID=" + sessionID.getAttribute("sesid");
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(parametro);
}