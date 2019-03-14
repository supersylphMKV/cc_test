var r;

async function Insert(query){
}

async function Update(query){
}

async function List(query){

}

async function Remove(query){
}

async function FindById(query){
}

async function FindByFilter(query){
}

async function NewTable(query){
    var cmd = r.db(query.db).tableCreate(query.table);

    return cmd.run().then(res=>{
        return res;
    }).error(err=>{
        throw err;
    })
}

module.exports = async function(config){
    r = config.r;

    return {
        Insert : Insert,
        Update : Update,
        List : List,
        Remove : Remove,
        FindById : FindById,
        FindByFilter : FindByFilter
    };
};