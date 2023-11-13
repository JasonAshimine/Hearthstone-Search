const CONFIG = {
	"id":{
		"type":"string"
	},
	"name":{
		"type":"string"
	},
	"text":{
		"alt":["t"],
		"type":"string"
	},
	"flavor":{
		"type":"string"
	},	
	"cost":{
		"alt":["c","mv","m"],
		"var": ["attack", "health"],
		"type":"number"
	},
	"attack":{
		"alt":["atk"],
		"var": ["cost", "health"],
		"type":"number"
	},
	"health":{
		"alt":["hp"],
		"var": ["cost", "attack"],
		"type":"number"
	},
	"rarity":{
		"alt":["r"],
		"type":"string"
	},
	"type":{
		"type":"string"
	},
	"spellSchool":{
		"alt":["school", "spell"],
		"type":"string"
	},
	"set":{
		"type":"string"
	},	
	"races":{
		"alt":["race"],
		"isArray":true,
		"type": "string"
	},
	"mechanics":{
		"alt":["mechanic"],
		"isArray":true,
		"type": "string"
	},
	"referencedTags":{
		"alt":["reference","ref"],
		"isArray":true,
		"type": "string"
	},
	"classes":{
		"alt":["class","hero", "h"],
		"index":["classes", "cardClass"],
		"type": "compound"
	},
	"is":{
		"index":["type", "races","spellSchool", "rarity"],
		"type": "compound"
	},
	"tag":{
		"alt":["tags"],
		"index":["mechanics", "referencedTags"],
		"type": "compound"
	}
};

const PRESET = {
	default: 'name',
	prefix: {
		exact:'!',
		every:'&',
		not:'-',
	}	
};



const REFERENCE = getReference(CONFIG);

function getReference(config){
	return Object.entries(config)
	.map(([key, val]) => [key, {key, ...val}])
	.reduce((acc, [key, val]) => {
		const add = (index) => {
			if(acc[index])
				throw {message: 'duplicate', key, index, val};
			acc[index] = val;
		}
		
		add(key);
		val.alt?.forEach(add);
	
		return acc;		
	}, {});	
}