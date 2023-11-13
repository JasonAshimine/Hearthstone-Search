/* ---------------------------------------------------------
Iniatal parser creation.


TODO: parser factory w/ config/presets & general cleanup
TODO: move setup/config into parser factory: 
	gen(config,preset)-> parserFactory(text, option: data?, defaultKey?)
	
TODO: validate input text
*/

class ParserError extends Error {
  constructor(message, data) {
    super(`${message}`); // (1)
    this.name = "ParserError"; // (2)
		this.data = data;
  }
}

function parser(text){
	try{
		let result = parseText(text);
		if(!result) 
			return null;

		console.log(result);
		return handler(result.values());
	}
	catch(e){
		console.error(e);
		return null;
	}
}

function parseText(text){	//split text into test cases | non-space char	
	//[prefix]*(key(:|<=>))?(values:word|"words"|/regex/)(,values)* | non-space char
	const regex = /[-!&]*(?:\w+\s*(?:<=|>=|>|<|:)\s*)?(?:\d+\s*-\s*\d+|\d+|"[^"]+"|\/(?:\\\/|[^\/])*\/\w*|\w+)(?:\s*,\s*(?:\d+\s*-\s*\d+|\d+|"[^"]+"|\/(?:\\\/|[^\/])*\/\w*|\w+))*|\S/g;
	//const regex = /[-!&]*(?:\w+\s?(?:<=|>=|>|<|:)\s?)?(?:\d+\s*-\s*\d+|\d+|"[^"]+"|\/(?:\\\/|[^\/])*\/\w*|\w+)(?:\s*,\s*(?:\d+\s*-\s*\d+|\d+|"[^"]+"|\/(?:\\\/|[^\/])*\/\w*|\w+))*|\S/g;
	
	//[prefix]*key(:|<=>)|value|non-space char
	//const regex = /[-!&]*\w+(?:<=|>=|>|<|:)|(?:\d+\s*-\s*\d+|\d+|"[^"]+"|\/(?:\\\/|[^\/])*\/\w*|\w+)|\S/g
	//paramFactory(key, value)
	//, append value to previous
	
	return text.match(regex);
}

function handler(iterator){	//iterate over parsedText [param | word | non-space char]
	let group = new Group();
		
	for(const val of iterator)
		switch(val){
			case ')': return group;	//return sub-group to main
			//case ',':  group.previous.val.push(valueFactory(iterator.next().value)); break;
			case 'or': group.or(); break;
			case '(': group.add(handler(iterator)); break;	//create sub-group
			default: group.add(handleParamText(val))
		}
		
	return group;
}

/* ---------------------------------------------------------
Primary Group
or: [and:[], ...]	//or.some(test == true)
and: [param]	//and.every(test == true)
param: {prefix, key, val:[value], test(), toString()}
value: {test(), toString()}	//class, regex, etc.

All Groups, params, values: 
	Required: .test(data):<boolean> & .toString()
*/

class ParamError extends Error {
  constructor(message, param, obj) {
    super(`${param}\n${message}`); // (1)
    this.name = "ParamError"; // (2)
		this.param = param;
		this.obj = obj;
  }
}

class Group extends Array{
	constructor(){
		super();
		this.or();
	}
	
	get last() {return this[this.length-1];}
	get previous() { return this.last[this.last.length-1]; }
		
	or(){ this.push([]); }
	
	add(param){ this.last.push(param); }
	
	test(obj){ 
		return this.some(and => and.every(param => {
			try{
				return param.test(obj);
			}
			catch(e){	//map error to Param error
				if(e instanceof ParamError)	//if sub group rethrow
					throw e;
				throw new ParamError(e, param, obj);
			}
		})); 
	}
	toString(){ return this.map(and => and.map(i => i instanceof Group ? `(${i})` : `${i}`).join(' ')).join(' or ')}
}

/* ---------------------------------------------------------
Param

TODO: key types data storage / value parser
TODO: special preset values i.e. is:even|odd //maybe pass obj to value?
TODO: variable values i.e. hp < atk
*/

class param{	
	constructor({prefix, key, val}){
		this.prefix = prefix;
		this.key = key;
		this.val = val;
		
		this.queryType = 'some';	//default: val,val == val or val
		
		if(prefix?.includes('&'))
			this.queryType = 'every';	//val,val == val & val
		
		if(prefix?.includes('!'))
			this.exact = true;
		
		if(prefix?.includes('-')){	//invert test fn
			this.not = true;
			
			this.test = function(obj){	//TODO: find better way
				return !this.testValue(this.getData(obj));
			}
		}
	}
		
	getData(obj){ return obj[this.key]; }
	testValue(value, obj){ 
		return this.val[this.queryType](v => v.test(value, obj)); 
	}
	
	test(obj = {}){
		return this.testValue(this.getData(obj), obj);
	}
	
	toString(){
		return `${this.prefix}${this.key ? this.key+':' : ''}${this.val}`;
	}
}

class paramArray extends param{	//typeof obj[key] == array
	testValue(valueArray, obj){
		return valueArray?.some(data => super.testValue(data, obj));
	}
}

class paramIndex extends paramArray{	//combined multiple index: data = flat[obj[key1], obj[key2]]
	constructor(data, index){
		super(data);
		
		this.index = index;
	}
	
	getData(obj){ 
		return this.index.flatMap(key => obj[key]); 
	}
}

function parseParamText(text){
	//(prefix)*(key)?(val)+
	const regex = /([-!&]*)(?:(\w+)\s*(<=|>=|>|<|:)\s*)?(.*)/;
	let [_, prefix, key, operator = ":", val] = text.match(regex);
	
	let values = val.match(/\d+\s*-\s*\d+|\d+|"[^"]+"|\/(?:\\\/|[^\/])*\/\w*|\w+/g); 
	
	return {prefix, key, operator, val, values};
}

function handleParamText(text){ //convert text case into test case obj
	const {prefix, key, operator, val, values} = parseParamText(text);
	const option = REFERENCE[key ?? 'name'];
	
	if(!option)
		throw new ReferenceError(`Key does not exist [${key}]`);
		
	if(!values)
		throw new SyntaxError(`Invalid values [${text}]`);	
	
	const mappedValue = values?.map(value => valueFactory(value, operator, option, prefix));
	const setting = {prefix, key: option.key, val:mappedValue};
	
	if(option.index)
		return new paramIndex(setting, option.index);
	
	if(option.isArray)
		return new paramArray(setting);

	return new param(setting);
}

/* ---------------------------------------------------------
Value
value: {value?, test(), toString()}	//class, regex, etc.

TODO: clean up value factory
*/

function valueFactory(text, operator, option, prefix){
	const {type} = option;
	
	if(text == "undefined")
		return new value(undefined);
	
	//TODO: boolean
	
	if(type == 'string' || type == 'compound')
		return stringFactory(text, operator, prefix.includes('!'));
	
	if(type == 'number')
		return numberFactory(text, operator);
	
	throw SyntaxError('Invalid type ' + type);
}

function stringFactory(text, operator, _exact){
	if(/^\/.*\/\w?$/.test(text))
		return parseRegex(text);
	
	if(text.includes('"'))
		return new quote(text, operator, _exact);
		
	return new string(text, operator, _exact);
}

function numberFactory(text, operator){
	if(/^\d+$/.test(text))
		return new number(text, operator);
	
	if(/\d+\s*-\s*\d+/.test(text))
		return new range(text);
	
	throw SyntaxError('Invalid number', text);
}


class value{
	constructor(text){this.value = text;}
	test(val){ return val == this.value; }
	toString(){return this.value;}
}

class compare extends value{
	constructor(text, operator){
		super(text);
		this.operator = operator;
		
		switch(operator){ //cannot override test in constructor. breaks extended class.test()
			case '<': this.compare = function(val){ return  val < this.value; }; break;
			case '>': this.compare = function(val){ return  val > this.value; }; break;
			case '<=': this.compare = function(val){ return val <= this.value; }; break;
			case '>=': this.compare = function(val){ return val >= this.value; }; break;
		}
	}
	
	compare(val){ return super.test(val); }	
	test(val){ return this.compare(val); }
}


class string extends compare{
	string = true;
	constructor(data, operator = ':', _exact){
		super(data.toLowerCase(), operator);
		
		if(!_exact && operator == ':')	//TODO: fix override test - bad practice: override extended class.test()
			this.test = function(val) {return val?.toLowerCase().includes(this.value); }	
	}
	test(val){ return super.test(val?.toLowerCase());  }
}

class quote extends string{
	quote = true;
	constructor(text, operator, _exact){
		super(text.replaceAll('"',''), operator, _exact);
	}
	toString(){ return `"${this.value}"`; }
}

class number extends compare{
	number = true;
	constructor(text, operator){
		super(Number(text), operator);
	}	
}


class range{
	range = true;
	constructor(text){
		[this.min, this.max] = text.split('-').map(Number);

		if(this.value.some(isNaN) || this.max < this.min)
			throw new RangeError(`invalid range: ${text}`)
	}
	
	get value() {return [this.min, this.max]; }
	
	test(val){ return val >= this.min && val <= this.max; }
	toString(){ return `${this.min}-${this.max}`; }
}

function parseRegex(text){
	const [_, exp, flag] = text.match(/\/(.*)\/(\w?)/);
	return new RegExp(exp, flag);
}