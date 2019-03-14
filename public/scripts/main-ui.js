var socket = io();
var currEmpTab;
var currEpmData;
var elements = {
    emp_tab     : $('#emp_list_tab'),
    emp_list    : $('#emp_list_body'),
    emp_search  : $('#emp_search'),
    dpt_ctrl    : $('#emp_dept_ctrl'),
    dpt_sel     : $('select[name="dept"]'),
    dpt_add_btn : $('#emp_dept_add'),
    dpt_add_new : $('input[name="other_dept"]'),
    user_form_n : $('form[name="form_emp_new"]'),
    user_form_i : $('form[name="form_emp_info"]')
};

//memastikan container tab departemen dan daftar karyawan kosong
$(elements.emp_tab).empty();
$(elements.emp_list).empty();

//inisiasi event listeners
$(elements.dpt_sel).change(function(){
    if($(this).val() == 'add'){
        $(elements.dpt_ctrl).children(':last-child').show();
    } else {
        $(elements.dpt_ctrl).children(':last-child').hide();
    }
});

$(elements.emp_search).keyup(function(){
    var filter = $(this).val();
    var list   = $(elements.emp_list).children();

    if(filter !== ''){
        $(list).hide();
        list.each(function(){
            var elm = $(this).html().toLowerCase();
            if(elm.indexOf(filter.toLowerCase()) > -1){
                $(this).show();
            }
        })
    } else {
        $(list).show();
    }
});

$(elements.dpt_add_btn).click(function(){
    var newDeptVal = $(elements.dpt_add_new).val().toLowerCase();
    if(newDeptVal !== ''){
        socket.emit('dept_new',newDeptVal,function(nd,res){
            if(res.success){
                var newDeptElm = $('' +
                    '<div class="acc-btn">'+ nd.toUpperCase() +'</div>');
                var newDeptOpt = $('' +
                    '<option value="'+ nd +'" selected>'+ nd.toUpperCase() +'</option>');
                $(elements.emp_tab).append(newDeptElm);
                $(elements.dpt_sel).children(':last-child').before(newDeptOpt);

                $(elements.dpt_ctrl).children(':last-child').hide();
            }
        }.bind(null,newDeptVal))
    }
});

$(elements.user_form_n).submit(function(e){
    e.preventDefault();
    var data = GetFormData($(this));

    console.log(data);
    if(data.dept && data.dept !== 'add'){
        socket.emit('empl_new',data,function(res){
            if(res.success){
                SelectDept();
            }
        })
    }
});

$(elements.user_form_i).submit(function(e){
    e.preventDefault();
    var data = GetFormData($(this));
    data.id = currEpmData.id;
    UpdateUser(data);
});

//download data awal
socket.emit('db_list',{
   db:'users'
},function(res){
    if(res){
        if(res.length){
            $(elements.dpt_ctrl).children(':last-child').hide();

            for(var t=0; t < res.length; t++){
                var newDeptElm = $('' +
                    '<div class="acc-btn">'+ res[t].toUpperCase() +'</div>');
                var newDeptOpt = $('' +
                    '<option value="'+ res[t] +'">'+ res[t].toUpperCase() +'</option>');

                $(newDeptElm).click(function(){
                    currEmpTab = $(this).text().toLowerCase();
                    $(elements.emp_tab).children().removeClass('acc-btn-active');
                    $(this).addClass('acc-btn-active');
                    SelectDept();
                });

                $(elements.emp_tab).append(newDeptElm);
                $(elements.dpt_sel).children(':last-child').before(newDeptOpt);
            }

            currEmpTab = res[0];
            $(elements.dpt_sel).val(res[0]);
            $(elements.emp_tab).children().removeClass('acc-btn-active');
            $(elements.emp_tab).children(':first-child').addClass('acc-btn-active');

            SelectDept();
        }
    }
});


function SelectDept(){
    $(elements.emp_list).empty();
    socket.emit('db_list',{
        db:'users',
        table:currEmpTab
    },function(res){
        if(res && res.length){
            for(var k=0;k<res.length;k++){
                var empElm = $('' +
                    '<li style="position: relative; padding: 8px; border: solid thin darkgrey; margin: 4px;" data-value="'+ res[k].id +'">' +
                    '<div>' + res[k].first_name + ' ' + res[k].last_name + '</div>' +
                    '<button value="'+ res[k].id +'" style="position: absolute; right: 0;top: 0;">x</i>' +
                    '</li>');

                $(empElm).children('button:only-of-type').click(RemoveUser);
                $(empElm).click(GetUser);

                $(elements.emp_list).append($(empElm));

            }
        }
    })
}

function GetUser(){
    socket.emit('empl_get',{
        dept:currEmpTab,
        id:$(this).children('button:only-of-type').val()
    },function(res){
        if(res){
            currEpmData = res;
            $(elements.user_form_i).find('input[name="first_name"]').val(res.first_name);
            $(elements.user_form_i).find('input[name="last_name"]').val(res.last_name);
            $(elements.user_form_i).find('input[name="pob"]').val(res.pob);
            $(elements.user_form_i).find('input[name="dob"]').val(res.dob);
            $(elements.user_form_i).find('input[name="phone"]').val(res.phone);
            $(elements.user_form_i).find('input[name="mail"]').val(res.mail);
            $(elements.user_form_i).find('input[name="address"]').val(res.address);

            $(elements.user_form_i).find('select[name="dept"]').empty();
            $(elements.dpt_sel).children().each(function(){
                var optVal = $(this).val();
                var optElm = $('' +
                    '<option value="'+ $(this).val() +'">'+ $(this).text() +'</option>');

                $(elements.user_form_i).find('select[name="dept"]').append($(optElm));
            });
            $(elements.user_form_i).find('select[name="dept"]').val(res.dept).select();
        }
    });
}

function NewUser(data){
    socket.emit('empl_new',data,function(res){
        if(res.success){
            if(data.dept == currEmpTab){
                SelectDept();
            }
        }
    })
}

function UpdateUser(data){
    if(data.dept !== currEpmData.dept){
        data.moved = currEpmData.dept;
    }
    socket.emit('empl_upd',data,function(res){
        if(res.success){
            SelectDept();
        }
    });
}

function RemoveUser(){
    socket.emit('empl_rem',{
        dept:currEmpTab,
        id:$(this).val()
    },function(elm,res){
        if(res.success){
            $(elm).parent().remove();
        }
    }.bind(null,$(this)));
}

function GetFormData(form){
    var dataArray = $(form).serializeArray();
    var val = {};
    for(var d=0;d<dataArray.length;d++){
        if(dataArray[d].value){
            if(val[dataArray[d].name]){
                if(!(val[dataArray[d].name] instanceof Array)){
                    val[dataArray[d].name] = [val[dataArray[d].name]];
                }
                val[dataArray[d].name][val[dataArray[d].name].length] = dataArray[d].value;
            } else {
                val[dataArray[d].name] = dataArray[d].value;
            }
        }
    }
    return val;
}
