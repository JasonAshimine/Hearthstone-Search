/* let table = new DataTable('#myTable', {
    // config options...
}); */


//Wild: EXPERT1 + LEGACY > WONDERS + CORE + set
//standard: CORE + standard set;
//twist: WONDERS + twist set;
const SET_FILTER = [
	"HERO_SKINS","TB","LETTUCE","BATTLEGROUNDS","BASIC","TAVERNS_OF_TIME",
	"VANILLA", //Vanilla mode 
	//"WONDERS",	//twist
	"PLACEHOLDER_202204", //?
	"CREDITS","MISSIONS"
];

const state = {
	query: null
}



$(document).ready(() => {
	/*$('#search').keypress(e => {
		if(e.key == 'Enter'){
			e.preventDefault();
			handleSearch(e.target.value);
		}
	});
	*/
	$('#ok').click(() => handleSearch($('#search').val()));

	$('#clear').click(() => {
		$('#search, [type="search"]').val(null);
		$('#myTable').DataTable().search('').draw();
	});
	

	$("form").on("submit", (e) => {
		handleSearch($('#search').val());
		e.preventDefault();
	})

	db.on('ready', setUpTable)
});

(async () => {
  await db.open();

	window.DATA = await db.cards
		.where('set').noneOf(SET_FILTER)
		.toArray();

	console.log('ready');
})()


function handleSearch(text){
	if(!DataTable.isDataTable($('#myTable')))
		return console.warn('not ready');
	
	let query = parser(text);
	
	console.log(text, query);
	
	state.query = query;
	$('#myTable').DataTable().draw();
}


async function setUpTable(){
	const data = await db.cards
		.where('set').noneOf(SET_FILTER)
		.toArray();
		
	
	DataTable.ext.search.push((settings, row, rowIndex, data) => {
		if(!state.query || !state.query?.test) return true;
		
		return state.query.test(data);
	});

	
	const statRender = (_, type, data) => `${data.attack ?? '-'}/${data.health ?? '-'}`;
	
	const subTypes = data => data.races ?? data.spellSchool;
	
	const typeRender = (_, type, data) => `${data.type}: ${subTypes(data) ?? '-'}`;
	
	const classRender = (_,type, data) => data.classes ?? data.cardClass;
	
	$('#myTable').DataTable({
		data,
		dom: '<"button">rtlip',
		columns: [
			{ title:'name', data: 'name'},
			{ title:'class', data: 'cardClass', defaultContent: "-", render: classRender},
			//{ title:'set', data: 'set', defaultContent: "-"},
			{ title:'type', data: 'type', render: typeRender},
			//{ title:'subtype', defaultContent: "-", render: subTypeRender},
			{ title:'cost', data: 'cost' , defaultContent: "-"},
			{ title:'stat',  defaultContent: "-",  render: statRender},
			//{ data: 'health', defaultContent: "-"},
			{ data: 'text',  defaultContent: "-" }		
		]
	});
	
}

function checkCardSet(set, _exclude = []){
	return search(`set:${set}`).reduce((acc, card) => {
		let res = checkCard(card);
		
		if(res.length){
			res.forEach(obj => {
				if(!acc.diff[obj.set])
					acc.diff[obj.set] = [];
				acc.diff[obj.set].push(compareCard(card, obj));
			})
		}			
		else
			acc.same.push(card);
	return acc;}, 
	{same:[], diff:{}}
	)
}


function search(text, data = DATA){
	let query = parser(text);

	if(!query) return [];
	
	return data.filter(obj => query.test(obj)).sort((a,b) => a.cost - b.cost);
}
