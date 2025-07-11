<template>
    <Form
        :form
        class="grid grid-cols-1 gap-4"
    >
        <FormField
            :form
            name="email"
            label="Email"
            hint="Your email address"
        >
            <FormInput
                v-model="form.fields.email"
                type="text"
                placeholder="Email"
                class="border p-2 rounded"
            />
        </FormField>
        <FormField
            :form
            name="password"
            label="Password"
            hint="Your password"
        >
            <FormInput
                v-model="form.fields.password"
                type="password"
                placeholder="Password"
                class="border p-2 rounded"
            />
        </FormField>

        <button class="bg-black rounded-sm text-white p-2">Login</button>
    </Form>
</template>

<script setup lang="ts">
import { useLaravelSanctum } from '#imports'

const { login } = useLaravelSanctum()
const form = login()
</script>
