<script setup lang="ts">
const oportunidade = useOportunidade();

const comments = computed(() => oportunidade.comments.data.data ?? []);

const handleSend = async (content: string, anexos: any[] = []) => {
    if (!oportunidade.data?.id) return false;
    return await oportunidade.sendComment(
        oportunidade.data.id,
        content,
        anexos,
    );
};

const handleEdit = async (id: number, content: string, anexos: any[] = []) => {
    if (!oportunidade.data?.id) return false;
    return await oportunidade.editComment(
        oportunidade.data.id,
        id,
        content,
        anexos,
    );
};

const handleDelete = async (id: number) => {
    if (!oportunidade.data?.id) return false;
    return await oportunidade.deleteComment(oportunidade.data.id, id);
};

const handleLoadMore = async () => {
    if (!oportunidade.data?.id) return;
    await oportunidade.loadMoreComments(oportunidade.data.id);
};
</script>

<template>
    <ElScrollbar class="!relative !h-full !w-full">
        <div class="p-4">
            <UICommentArea
                v-if="!oportunidade.comments.isLoading"
                :comments="comments"
                :is-submitting="oportunidade.isSubmitting"
                :is-loading="oportunidade.comments.isLoading"
                :has-more="oportunidade.hasMoreComments"
                :on-send="handleSend"
                :on-edit="handleEdit"
                :on-delete="handleDelete"
                :on-load-more="handleLoadMore"
            />
            <UILoadingOverlay v-if="oportunidade.comments.isLoading" />
        </div>
    </ElScrollbar>
</template>
