<script setup>

import { ref, computed, watch } from "vue";
const tabsOptions = ref([]);  //当前窗口的所有标签页
const activeTab = ref(""); // select 选中的当前tab
const activeTabCookies = ref([]); // select选中的tab下的所有cookie

const getTagCookies = (tab) => {
    chrome.cookies.getAll({ url: tab.url, },
        async (cookies) => {
            let [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTabCookies = await chrome.cookies.getAll({ url: currentTab.url })
            const names = currentTabCookies.map((item) => item.name);
            activeTabCookies.value = cookies.map(item => {
                return {
                    ...item,
                    sameName: names.includes(item.name)
                }
            });
        }
    );
};


const init = async () => {
    let tabs = await chrome.tabs.query({});
    tabsOptions.value = tabs;
    // 当前窗口激活的tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab.value = tab.id;
    getTagCookies(tab);
}
init()

const tagChange = async (val) => {
    const tab = tabsOptions.value.filter((item) => item.id == val)[0];
    getTagCookies(tab);
    activeTab.value = tab.id;
    //   console.log(tab, '-=-=222-');
};


const chosenRows = ref([]);
const handleSelectionChange = (val) => {
    chosenRows.value = val;
};

const setToTab = async (row) => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.cookies.set(
        { name: row.name, value: row.value, url: tab.url },
        (cookies) => {
            for (let index = 0; index < activeTabCookies.value.length; index++) {
                const el = activeTabCookies.value[index];
                if (row.name == el.name) {
                    el.isSet = true
                    break
                }
            }
        }
    );
}
const deleteCookie = async (record) => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.cookies.remove({ name: record.name, url: tab.url }, (cookies) => {
        activeTabCookies.value = activeTabCookies.value.filter(
            (item) => item.name != record.name
        );
    });
};

const SetCookies = async (type) => {
    if (type == "SetAll" || type == "SetChosen") {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const setArr = type == "SetAll" ? activeTabCookies.value : chosenRows.value;
        let setCookiesName = [];
        setArr.forEach((item, index) => {
            setCookiesName.push(item.name);
            chrome.cookies.set(
                { name: item.name, value: item.value,path:'/', url: tab.url },
                (cookies) => { }
            );
        });
        activeTabCookies.value = activeTabCookies.value.map((cookieItem) => {
            console.log(cookieItem.name, 'cookieItem.namecookieItem.name');
            if (setCookiesName.includes(cookieItem.name)) {
                cookieItem.isSet = true;
            }
            return cookieItem;
        });
    }
}
const handleActions = {
    ClearAll: async () => {
        const tab = tabsOptions.value.filter(
            (item) => item.id == activeTab.value
        )[0];
        activeTabCookies.value.forEach((item, index) => {
            chrome.cookies.remove({ name: item.name, url: tab.url }, (cookies) => {
                if (activeTabCookies.value.length - 1 == index) {
                    activeTabCookies.value = [];
                }
            });
        });
    },
    SetAll: (type) => {
        SetCookies(type)
    },
    SetChosen: (type) => {
        SetCookies(type)
    },
}
const onActions = (actionType) => {
    handleActions[actionType] && handleActions[actionType](actionType)
}
</script>

<template>
    <div style="min-width: 500px;min-height:400px;padding: 20px;">
        <div>
            <div style="padding: 5px 0;">选择窗口内的标签页(默认为当前标签页):</div>
            <el-select v-model="activeTab" @change="tagChange" class="m-2" placeholder="Select" style="width: 100%;">
                <el-option v-for="item in tabsOptions" :key="item.id" :label="item.url" :value="item.id" />
            </el-select>
        </div>
        <el-space wrap style="padding: 10px 0 0 0;">
            <el-tooltip class="box-item" effect="dark" content="回到(选中)当前标签页" placement="bottom">
                <el-button @click="init" size="small">回到当前</el-button>
            </el-tooltip>
            <el-tooltip class="box-item" effect="dark" content="删除选中标签页所有cookie" placement="bottom">
                <el-button @click="onActions('ClearAll')" size="small">清除所有</el-button>
            </el-tooltip>
            <el-tooltip class="box-item" effect="dark" content="将表格所有cookie设置到当前显示的标签页" placement="bottom">
                <el-button @click="onActions('SetAll')" size="small">设置所有</el-button>
            </el-tooltip>
            <el-tooltip class="box-item" effect="dark" content="表格选中项(cookie)设置到当前显示的标签页" placement="bottom">
                <el-button @click="onActions('SetChosen')" size="small">设置选择项</el-button>
            </el-tooltip>

        </el-space>
        <p style="color: #ccc;padding: 0;">表格数据为【选中标签页】下的所有cookie</p>
        <el-table :data="activeTabCookies" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" />
            <el-table-column type="index" />
            <el-table-column prop="name" label="名称" width="120">
                <template #default="{ row }">
                    <el-tag :type="row.isSet ? 'success' : row.sameName ? '' : 'info'">{{
                        row.name
                    }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="value" label="值" show-overflow-tooltip />
            <!-- :show-overflow-tooltip="false" -->
            <el-table-column label="操作" width="150">
                <template #default="{ row }">
                    <el-space wrap>
                        <el-tooltip class="box-item" effect="dark" content="将此项(cookie)设置到当前标签页" placement="top">
                            <el-link type="primary" style="font-size: 12px;" @click="setToTab(row)">设置到当前</el-link>
                        </el-tooltip>
                        <el-link type="primary" style="font-size: 12px;" @click="deleteCookie(row)">删除</el-link>
                    </el-space>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
