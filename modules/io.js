var r;

function SetConnection(socket){
    //raw db methods
    socket.on('db_list',function(data,cb){
        var cmd = r.db(data.db);

        if(data.table){
            cmd = cmd.table(data.table);
        } else {
            cmd = cmd.tableList();
        }

        cmd.run().then(res=>{
            cb(res);
        }).error(err=>{
            console.error(err);
        })
    });
    socket.on('db_get',function(data,cb){

    });
    socket.on('db_remove',function(data,cb){

    });
    socket.on('db_new',function(data,cb){

    });

    //employee control
    socket.on('empl_new',function(data,cb){
        r.db('users').table(data.dept).insert(data).run().then(res=>{
            cb({success:true});
        }).error(err=>{
            console.error(err);
        });
    });
    socket.on('empl_rem',function(data,cb){
        r.db('users').table(data.dept).get(data.id).delete().run().then(res=>{
            cb({success:true});
        }).error(err=>{
            console.error(err);
        })
    });
    socket.on('empl_get',function(data,cb){
        r.db('users').table(data.dept).get(data.id).run().then(res=>{
            cb(res);
        }).error(err=>{
            console.error(err);
        })
    });
    socket.on('empl_upd',function(data,cb){
        if(data.moved){
            r.db('users').table(data.moved).get(data.id).delete().run();
            delete data.moved;
            r.db('users').table(data.dept).insert(data).then(res=>{
                cb({success:true});
            }).error(err=>{
                console.error(err);
            })
        } else {
            r.db('users').table(data.dept).get(data.id).update(data).run().then(res=>{
                cb({success:true});
            }).error(err=>{
                console.error(err);
            })
        }
    });

    //dept control
    socket.on('dept_new',function(data,cb){
        r.db('users').tableCreate(data).run().then(()=>{
            cb({success : true});
        }).error(err=>{
            console.error(err);
        })
    });
    socket.on('dept_rem',function(data,cb){
        r.db('users').tableDrop(data).run().then(()=>{
            cb({success : true});
        }).error(err=>{
            console.error(err);
        })
    })
}

async function DBStructureCheck(){
    return r.dbList().run().then(db=>{
        if(db.indexOf('users') < 0){
            return r.dbCreate('users').run().then(()=>{
                return true;
            }).error(err=>{
                throw err;
            })
        } else {
            return true;
        }
    }).error(err=>{
        throw err;
        console.error(err);
    })
}

module.exports = async function(cfg){
    r = cfg.r;
    return DBStructureCheck().then(()=>{
        return {
            listen : SetConnection
        }
    }).catch(err=>{
        console.error(err);
    })
};