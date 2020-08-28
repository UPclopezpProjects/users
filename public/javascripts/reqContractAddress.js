//document.getElementById("body").onload = function() {reqContractAdd()};

function reqContractAdd() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      	document.getElementById("divAnswer").innerHTML = xhttp.responseText;
    }
  };
  
  //xhttp.open("GET", "/getMyContract/dirs/:"+x, true);
  xhttp.open("GET", "/getMyContract", true);
  xhttp.send();
}
