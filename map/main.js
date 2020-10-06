var pymChild = new pym.Child();

d3.queue()
	.defer(d3.csv, "https://docs.google.com/spreadsheets/d/1_h02i-2HxliPC0uqn0qyIqXtIUQo4Xhuq6aYLad3wLk/gviz/tq?tqx=out:csv")
	// .defer(d3.json, "data/msoacentroidshp.json")
	.await(ready);

function ready(error, featureService /*geogbound, geog*/) {

//	console.log(featureService)
	if (error) {
		console.error(error);
		return;
	}

	if ('latest_7_days' in featureService[0]) {
		casesfield = 'latest_7_days';
	} else {
		casesfield = Object.keys(featureService[0])[Object.keys(featureService[0]).length-1];
	}

	console.log(featureService);

	var data = featureService.map(function(feature) {
		if(feature[casesfield] == "-99") {
			feature[casesfield]=0;
		}
		return {
			areacd: feature.msoa11_cd,
			areanm: feature.msoa11_hclnm,
			areanmhc: feature.msoa11_hclnm,
			cases: feature[casesfield],
			casesMar: feature[casesfield],
			casesApr: feature[casesfield],
			casesMay: feature[casesfield],
			casesJune: feature[casesfield]

		};
	});


	dataAll = {};
	dataMar = {};
	dataApr = {};
	dataMay = {};
	dataJune = {};

	data.forEach(function(d){
		dataAll[d.areacd] = +d.cases,
		dataMar[d.areacd] = +d.casesMar,
		dataApr[d.areacd] = +d.casesApr,
		dataMay[d.areacd] = +d.casesMay,
		dataJune[d.areacd] = +d.casesJune
	});


	const areabyid = [];
	const cases = [];
	const cases2 = [];
	const areanmhc = [];

	data.forEach(function(d, i) {
			cases[d.areacd] = +d.cases;
			areanmhc[d.areacd] = d.areanmhc;
			cases2[i] = +d.cases;
			areabyid[d.areacd] = d.areanm;

	});


	var maxvalue = d3.max(cases2);

	map = new mapboxgl.Map({
		container: "map",
		style: "data/style.json",
		center: [-3.5, 52.355],
		zoom: 5,
		maxZoom: 13.9999,
		attributionControl: false
	})

	//add fullscreen option
	map.addControl(new mapboxgl.FullscreenControl());

	// Add zoom and rotation controls to the map.
	map.addControl(new mapboxgl.NavigationControl());

	// Disable map rotation using right click + drag
	map.dragRotate.disable();

	// Disable map rotation using touch rotation gesture
	map.touchZoomRotate.disableRotation();

	//add compact attribution
	// map.addControl(new mapboxgl.AttributionControl({
	// 	compact: true
	// }));

	map.addControl(new mapboxgl.AttributionControl({
		compact:true,customAttribution:"© Crown copyright and database rights "+new Date(Date.now()).getFullYear()+" OS 100019153"
		})
	);

	d3.selectAll(".mapboxgl-ctrl-icon").attr("aria-hidden","false")


	map.on("load", function() {
		//map.addSource("area", { type: "geojson", data: areas });

		map.addSource('msoa-centroids', {
			type: 'vector',
			"tiles": ["https://cdn.ons.gov.uk/maptiles/administrative/msoa/v1/centroids/{z}/{x}/{y}.pbf"],
			"promoteId": { "msoacentroids": "areacd" },
			"bounds": [-5.8,50.0,1.9,55.9],
			"minzoom":3,
			"maxzoom":14
		});



	//	map.addSource("areabound", { type: "geojson", data: areabounds });




		map.addLayer(
			{
				id: "coronabound",
				type: "fill",
				"source": {
					"type": "vector",
					"bounds": [-5.8,50.0,1.9,55.9],
					//"tiles": ["http://localhost:8000/boundaries/{z}/{x}/{y}.pbf"],
					"tiles": ["https://cdn.ons.gov.uk/maptiles/administrative/msoa/v1/boundaries/{z}/{x}/{y}.pbf"],
				},
				"source-layer": "boundaries",
				minzoom: 4,
				maxzoom: 21,
				layout: {},
				paint: {
					'fill-opacity': [
							'interpolate',
							  ['linear'],
							  // ['zoom'] indicates zoom, default at lowest number, threshold, value above threshold
							  ['zoom'],
							  10, 0,
							  11, 1
						],
					"fill-color": "rgba(255,255,255,0)",
					// "fill-outline": "grey",
					"fill-outline-color": "grey"
				}
			},
			"place_suburb"
		);

		map.addLayer(
			{
				id: "corona",
				type: "circle",
				"source": 'msoa-centroids',
				"source-layer": "msoacentroids",
				paint: {
					'circle-radius':
            ['interpolate', ['linear'], ['zoom'],
              4, ['case', ['!=', ['feature-state', 'casesPI'], null], ['/', ['feature-state', 'casesPI'], 0.9], 1],
              8, ['case', ['!=', ['feature-state', 'casesPI'], null], ['/', ['feature-state', 'casesPI'], 0.7], 1],
              16, ['case', ['!=', ['feature-state', 'casesPI'], null], ['/', ['feature-state', 'casesPI'], 0.09], 1]
            ],
					"circle-opacity": 0.7,
					'circle-color':
            ['case',
              ['!=', ['feature-state', 'casesPI'], null],
              [
                'interpolate', ['linear'],
                ['feature-state', 'cases'],
                0, '#ef6548',
								(maxvalue/10), '#d7301f',
                maxvalue, '#990000'
              ],
              '#FFFFFF'
            ]
				}
			},
			"place_suburb"
		);


		map.addLayer(
			{
				id: "coronahover",
				type: "circle",
				"source": 'msoa-centroids',
				"source-layer": "msoacentroids",
				paint: {
					'circle-radius':
            ['interpolate', ['linear'], ['zoom'],
						4, ['case', ['!=', ['feature-state', 'casesPI'], null], ['/', ['feature-state', 'casesPI'], 0.9], 1],
						8, ['case', ['!=', ['feature-state', 'casesPI'], null], ['/', ['feature-state', 'casesPI'], 0.7], 1],
						16, ['case', ['!=', ['feature-state', 'casesPI'], null], ['/', ['feature-state', 'casesPI'], 0.09], 1]
            ],
					"circle-opacity": 1,
					"circle-stroke-color": "black",
					"circle-stroke-width": 3,
					'circle-color':
            ['case',
              ['!=', ['feature-state', 'casesPI'], null],
              [
                'interpolate', ['linear'],
                ['feature-state', 'cases'],
                0, '#ef6548',
								(maxvalue/10), '#d7301f',
                maxvalue, '#990000'
              ],
              '#FFFFFF'
            ]
				},
				filter: ["==", "areacd", ""]
			},
			"place_suburb"
		);


		map.addLayer(
			 {
				id: "coronaboundhover",
				type: "line",
				"source": {
					"type": "vector",
					"bounds": [-5.8,50.0,1.9,55.9],
					//"tiles": ["https://cdn.ons.gov.uk/maptiles/t30/boundaries/{z}/{x}/{y}.pbf"],
					"tiles": ["https://cdn.ons.gov.uk/maptiles/administrative/msoa/v1/boundaries/{z}/{x}/{y}.pbf"],
					"minzoom":3,
					"maxzoom":14

					//"tiles": ["https://cdn.ons.gov.uk/maptiles/t23/boundaries/{z}/{x}/{y}.pbf"],
				},
				"source-layer": "boundaries",
				minzoom: 8,
				maxzoom: 20,
				layout: {},
				paint: {
					"line-color": "black",
					"line-width": 2
				},
			filter: ["==", "areacd", ""]
			},
			"place_suburb"
		);

		var bounds = new mapboxgl.LngLatBounds();

		// areas.features.forEach(function(feature) {
		// 	bounds.extend(feature.geometry.coordinates);
		// });


		map.fitBounds([[-5.8,50.0],[1.9,55.9]]);


			for (key in dataAll) {

			//	console.log(key);

				map.setFeatureState({
					source: 'msoa-centroids',
					sourceLayer: 'msoacentroids',
					id: key
				}, {
					casesPI: Math.sqrt(dataAll[key]/Math.PI),
					cases: dataAll[key]
				});
			}


	});

setLegend()


	map.on("mousemove", "coronabound", onMove);
	map.on("mouseleave", "coronabound", onLeave);
	map.on("click", "corona", onClick);




	map.on('click', function(e) {
		var features = map.queryRenderedFeatures(e.point);
	})

	function onMove(e) {

		var oldareacd = "ff";

		newareacd = e.features[0].properties.areacd;

		if (newareacd != oldareacd) {
			oldareacd = e.features[0].properties.areacd;

			map.setFilter("coronahover", [
				"==",
				"areacd",
				e.features[0].properties.areacd
			]);

			map.setFilter("coronaboundhover", [
				"==",
				"areacd",
				e.features[0].properties.areacd
			]);

			var features = map.queryRenderedFeatures(e.point, {
				layers: ["coronabound"]
			});

			if (features.length != 0) {
				setAxisVal(e.features[0].properties.areanm, e.features[0].properties.areanmhc, e.features[0].properties.areacd);
			}
		}
	}

	function onClick(e) {
		var oldareacd = "ff";
		newareacd = e.features[0].properties.areacd;

		if (newareacd != oldareacd) {
			oldareacd = e.features[0].properties.areacd;
			map.setFilter("coronahover", [
				"==",
				"areacd",
				e.features[0].properties.areacd
			]);

			map.setFilter("coronaboundhover", [
				"==",
				"areacd",
				e.features[0].properties.areacd
			]);
			console.log(e.features[0].properties)

			setAxisVal(e.features[0].properties.areanm, e.features[0].properties.areanmhc, e.features[0].properties.areacd);

		}
	}

	function onLeave() {
		map.setFilter("coronahover", ["==", "areacd", ""]);
		map.setFilter("coronaboundhover", ["==", "areacd", ""]);

		oldlsoa11cd = "";
		hideaxisVal();
	}

	function setAxisVal(areanm, areanmhc, areacd) {
		d3.select("#keyvalue")
			.style("font-weight", "bold")
			.html(function() {
				if(parseInt(d3.select("body").style("width")) <= 600) {
					if (dataAll[areacd] == 0) {
						return areanmhc + "<br><span id='msoacodetext'>MSOA " + areanm + "</span><br> <3 cases in the last 7 days*";
					} else if (!isNaN(dataAll[areacd])) {
						//console("I'm here")
						return areanmhc + "<br><span id='msoacodetext'>MSOA " + areanm + "</span><br>" + dataAll[areacd] + " cases in the last 7 days*";
					} else {
						return areanmhc + "<br><span id='msoacodetext'>MSOA " + areanm + "</span><br>" + dataAll[areacd] + " cases in the last 7 days*";
					}
				} else {
					if (dataAll[areacd] == 0) {
						return areanmhc + "<br><span id='msoacodetext'>MSOA " + areanm + "</span><br> <3 cases in the last 7 days*";
					} else if (!isNaN(dataAll[areacd])) {
						//console("I'm here")
						return areanmhc + "<br><span id='msoacodetext'>MSOA " + areanm + "</span><br>" + dataAll[areacd] + " cases in the last 7 days*";
					} else {
						return areanmhc + "<br><span id='msoacodetext'>MSOA " + areanm + "</span><br>" + dataAll[areacd] + " cases in the last 7 days*";
					}
				}

			});

		d3.select("#keyvaluehidden")
			.attr("aria-live","polite")
			.html("In " + areanmhc + " there have been " + dataAll[areacd] + " cases overall in the last 7 days.")


		d3.select("#deathLabel").text("Deaths");

		d3.select("#legendVal0").text(dataAll[areacd]);
		d3.select("#legendVal1").text(dataMar[areacd]);
		d3.select("#legendVal2").text(dataApr[areacd]);
		d3.select("#legendVal3").text(dataMay[areacd]);
		d3.select("#legendVal4").text(dataJune[areacd]);

		d3.select("#legendx0").style("width", dataAll[areacd] + "px");
		d3.select("#legendx1").style("width", dataMar[areacd] + "px");
		d3.select("#legendx2").style("width", dataApr[areacd] + "px");
		d3.select("#legendx3").style("width", dataMay[areacd] + "px");
		d3.select("#legendx4").style("width", dataJune[areacd] + "px");
	}

	function setLegend() {

		layernames = ["All","Mar","Apr","May","June"];

		//d3.select("#keydiv").append("div").attr("id","deathLabel").text("").style("position","relative").style("left","136px").style("height","20px")

		// legend = d3.select("#keydiv")//.append('ul')
		// 						// 	.attr('class', 'key')
		// 							.selectAll('g')
		// 							.data(["Overall","March","April","May","June"])
		// 							.enter()
		// 							.append('div')
		// 							.attr('class', function(d, i) { return 'key-item key-' + i + ' b '+ d.replace(' ', '-').toLowerCase(); })
		//
		//
		// 						legend.append("input")
		// 								.style("float","left")
		// 								.attr("id",function(d,i){return "radio"+i})
		// 								.attr("class","input input--radio js-focusable")
		// 								.attr("type","radio")
		// 								.attr("name","layerchoice")
		// 								.attr("value", function(d,i){return layernames[i]})
		// 								.property("checked", function(d,i){if(i==0){return true}})
		// 								.on("click",repaintLayer)
		//
		// 						legend.append('label')
		// 						.attr('class','legendlabel').text(function(d,i) {
		// 							var value = parseFloat(d).toFixed(1);
		// 							return d;
		// 						})
		//
		// 						legend.append('label')
		// 						.attr('class','legendVal')
		// 						.attr("id",function(d,i){return "legendVal" + i})
		// 						.text("")
		// 						.attr("value", function(d,i){return layernames[i]})
		// 						.on("click",repaintLayer);
		//
		// 						legend.append('div')
		// 						.attr('class','legendx')
		// 						.attr("id",function(d,i){return "legendx" + i})
		// 						.style("width", "0px")
		// 						.style("height","20px")
		// 						.style("margin-left","7px")
		// 						.style("margin-top","10px")
		// 						.style("background-color","black")
		// 						.style("position","relative")
		// 						.style("float","left")
		// 						.style("background-color","#1b5f97")

	}

	function repaintLayer() {

		layername = d3.select(this).attr("value");

		if(layername == "All") {
			for (key in dataAll) {

			//	console.log(key);

				map.setFeatureState({
					source: 'msoa-centroids',
					sourceLayer: 'msoacentroids',
					id: key
				}, {
					casesPI: Math.sqrt(eval(dataAll[key])/Math.PI),
					cases: dataAll[key]

				});
			}


		} else if(layername == "Mar") {

			for (key in dataAll) {

			//	console.log(key);

				map.setFeatureState({
					source: 'msoa-centroids',
					sourceLayer: 'msoacentroids',
					id: key
				}, {
					casesPI: Math.sqrt(eval(dataMar[key])/Math.PI),
					cases: dataMar[key]
				});
			}

		} else if(layername == "Apr") {

			for (key in dataAll) {

			//	console.log(key);

				map.setFeatureState({
					source: 'msoa-centroids',
					sourceLayer: 'msoacentroids',
					id: key
				}, {
					casesPI: Math.sqrt(eval(dataApr[key])/Math.PI),
					cases: dataApr[key]
				});
			}

		} else if(layername == "May") {

			for (key in dataAll) {

			//	console.log(key);

				map.setFeatureState({
					source: 'msoa-centroids',
					sourceLayer: 'msoacentroids',
					id: key
				}, {
					casesPI: Math.sqrt(eval(dataMay[key])/Math.PI),
					cases: dataMay[key]
				});
			}

		} else if(layername == "June") {

			for (key in dataAll) {

			//	console.log(key);

				map.setFeatureState({
					source: 'msoa-centroids',
					sourceLayer: 'msoacentroids',
					id: key
				}, {
					casesPI: Math.sqrt(eval(dataJune[key])/Math.PI),
					cases: dataJune[key]
				});
			}

		}




	}

	function hideaxisVal() {
		d3
			.select("#keyvalue")
			.style("font-weight", "bold")
			.text("");


			d3.selectAll(".legendVal")
				.text("");

			d3.selectAll("#deathLabel")
				.text("");

			d3.selectAll(".legendx")
				.style("width","0px");

	}


	$(".search-control").click(function() {
		$(".search-control").val('');
	})

	d3.select(".search-control").on("keydown", function() {
	if(d3.event.keyCode === 13){
		event.preventDefault();
		event.stopPropagation();

		myValue=$(".search-control").val();


		getCodes(myValue);
		pymChild.sendHeight();

	}
})

function tog(v){return v?'addClass':'removeClass';}

$(document).on('input', '.clearable', function(){
		$(this)[tog(this.value)]('x');
}).on('mousemove', '.x', function( e ){
		$(this)[tog(this.offsetWidth-28 < e.clientX-this.getBoundingClientRect().left)]('onX');
}).on('touchstart click', '.onX', function( ev ){
		ev.preventDefault();
		$(this).removeClass('x onX').val('').change();
		enableMouseEvents();
		onLeave();
		hideaxisVal();
});

	$("#submitPost").click(function( event ) {

					event.preventDefault();
					event.stopPropagation();

					myValue=$(".search-control").val();


					getCodes(myValue);
					pymChild.sendHeight();
	});


	function getCodes(myPC)	{

		//first show the remove cross
		d3.select(".search-control").append("abbr").attr("class","postcode")



			// dataLayer.push({
			// 					 'event': 'geoLocate',
			// 					 'selected': 'postcode'
			// 				 })

			var myURIstring=encodeURI("https://api.postcodes.io/postcodes/"+myPC);
			$.support.cors = true;
			$.ajax({
				type: "GET",
				crossDomain: true,
				dataType: "jsonp",
				url: myURIstring,
				error: function (xhr, ajaxOptions, thrownError) {
					},
				success: function(data1){
					if(data1.status == 200 ){
						//$("#pcError").hide();
						lat =data1.result.latitude;
						lng = data1.result.longitude;
						successpc(lat,lng)
					} else {
						$(".search-control").val("Sorry, invalid postcode.");
					}
				}

			});

		}


	function successpc(lat,lng) {

		map.jumpTo({center:[lng,lat], zoom:12})
		point = map.project([lng,lat]);


		setTimeout(function(){

		var tilechecker = setInterval(function(){
			 features=null
			 features = map.queryRenderedFeatures(point,{layers: ['coronabound']});

			 if(features.length != 0){

				 setTimeout(function(){
		 			features = map.queryRenderedFeatures(point,{layers: ['coronabound']});

		 		 //onrender(),
		 		//map.setFilter("coronahover", ["==", "areacd", features[0].properties.areacd]);

				map.setFilter("coronahover", [
					"==",
					"areacd",
					features[0].properties.areacd
				]);

				map.setFilter("coronaboundhover", [
					"==",
					"areacd",
					features[0].properties.areacd
				]);
				//var features = map.queryRenderedFeatures(point);
				disableMouseEvents();
				setAxisVal(features[0].properties.areanm, features[0].properties.areanmhc, features[0].properties.areacd);
				//updatePercent(features[0]);
			},400);
		 		clearInterval(tilechecker);
		 	}
		 },500)
		},500);




	};

	function disableMouseEvents() {
			map.off("mousemove", "coronabound", onMove);
			map.off("mouseleave", "coronabound", onLeave);
	}

	function enableMouseEvents() {
			map.on("mousemove", "coronabound", onMove);
			map.on("click", "corona", onClick);
			map.on("mouseleave", "coronabound", onLeave);
	}



}
