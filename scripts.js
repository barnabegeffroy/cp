function submitForm(event) {
  event.preventDefault();
  var codePostal = document.getElementById("codePostal").value;
  var rayon = document.getElementById("rayon").value;
  rechercherCodesPostaux(codePostal, rayon);
}

function rechercherCodesPostaux(codePostal, rayon) {
  $("#loading").show();
  $("#results").html("");

  var nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${codePostal}&country=France&limit=1`;

  $.ajax({
    url: nominatimUrl,
    type: "GET",
    success: function (response) {
      if (response.length > 0) {
        var latitude = response[0].lat;
        var longitude = response[0].lon;
        rechercherCodesPostauxAvecCoordonnees(latitude, longitude, rayon);
      } else {
        $("#results").html(
          "<p>Aucune information trouvée pour le code postal spécifié.</p>"
        );
        $("#loading").hide();
      }
    },
    error: function () {
      $("#results").html(
        "<p>Une erreur est survenue lors de la recherche des coordonnées.</p>"
      );
      $("#loading").hide();
    },
  });
}

function rechercherCodesPostauxAvecCoordonnees(latitude, longitude, rayon) {
  var overpassUrl = "https://overpass-api.de/api/interpreter";
  var overpassQuery = `[out:json][timeout:250];
    (
      node[place~"city|town|village"](around:${
        rayon * 1000
      },${latitude},${longitude});
    );
    out body;
    >;
    out skel qt;`;

  $.ajax({
    url: overpassUrl,
    type: "POST",
    data: { data: overpassQuery },
    success: function (response) {
      afficherCodesPostaux(response);
      $("#loading").hide();
    },
    error: function () {
      $("#results").html(
        "<p>Une erreur est survenue lors de la recherche.</p>"
      );
      $("#loading").hide();
    },
  });
}

function afficherCodesPostaux(data) {
  var codesPostaux = [];

  data.elements.forEach(function (element) {
    if (element.tags && element.tags["addr:postcode"]) {
      var codePostal = element.tags["addr:postcode"];
      var ville = element.tags["name"] || "Ville inconnue";
      var lien = `https://procuration-front-populaire.fr/console/proposals?status=pending&q=${codePostal}`;

      codesPostaux.push({
        codePostal: codePostal,
        ville: ville,
        lien: lien,
      });
    }
  });

  codesPostaux.sort(function (a, b) {
    return a.codePostal.localeCompare(b.codePostal);
  });

  var resultsHtml = "<p>Résultats :</p><ul>";
  codesPostaux.forEach(function (info) {
    resultsHtml += `<li><a href="${info.lien}" target="_blank">${info.codePostal} (${info.ville})</a></li>`;
  });
  resultsHtml += "</ul>";

  $("#results").html(resultsHtml);
}
